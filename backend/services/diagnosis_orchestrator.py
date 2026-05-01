"""
Unified diagnosis orchestration service.

Flow (matches product architecture):
1) Decision layer: image -> EfficientNet-B0 (modality weights; chest = MedMNIST ChestMNIST multi-label),
   text -> TF-IDF + logistic regression if `models/weights/symptom_text_clf.joblib` exists, else keyword rules.
2) Disease prediction
3) RAG (FAISS / Chroma) retrieval
4) LLM explanation (Gemini / configured provider)
5) Doctor mapping + module routes (portal, prescriptions, pharmacy, labs, reminders, tracking)
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from models.disease_mappings import get_full_disease_context
from models.medmnist_labels import MEDMNIST_DATASET_ID
from services.ai_service import AIService
from services.medical_image_pipeline import get_medical_image_pipeline
from services.symptom_diagnosis_service import get_symptom_diagnosis_service

logger = logging.getLogger(__name__)


class DiagnosisOrchestratorService:
    def __init__(self) -> None:
        self.ai_service = AIService()
        self.image_pipeline = get_medical_image_pipeline()
        self.symptom_service = get_symptom_diagnosis_service()

    async def run(
        self,
        symptoms: Optional[str],
        image_data: Optional[bytes],
        modality: str = "basic",
    ) -> dict:
        if not symptoms and not image_data:
            raise ValueError("Provide symptoms text or a medical image.")

        mod = (modality or "basic").strip().lower()
        
        # Auto-detect modality for medical images when basic mode is used
        if image_data and mod in ("basic", "normal", "general"):
            # Check if any trained models are available
            available_modalities = []
            for m in ["chest", "skin", "eye", "brain"]:
                model_path = f"models/weights/efficientnet_{m}_disease.pth"
                if os.path.exists(model_path):
                    available_modalities.append(m)
            
            # If models are available, try to auto-detect the best modality
            if available_modalities:
                # Priority order: chest (most common medical scans), skin, eye, brain
                # You can enhance this with actual image classification later
                if "chest" in available_modalities:
                    mod = "chest"  # Default to chest for X-rays/CT scans
                elif "skin" in available_modalities:
                    mod = "skin"  # Fallback to skin
                elif "eye" in available_modalities:
                    mod = "eye"
                elif "brain" in available_modalities:
                    mod = "brain"
                
                logger.info(f"🔍 Auto-detected modality: {mod} (available: {', '.join(available_modalities)})")

        if image_data:
            decision_path = "image"
            if mod in ("basic", "normal", "general"):
                vision_text = await self.ai_service.describe_image_basic(
                    image_data, "image/jpeg", symptoms or ""
                )
                vt = (vision_text or "").strip()
                if not vt:
                    raise ValueError(
                        "Basic image mode did not return a description. "
                        "Set AI_PROVIDER=gemini and GEMINI_API_KEY in backend/.env."
                    )
                if vt.startswith("[Basic mode needs Gemini") or vt.startswith("[Basic mode: vision call failed"):
                    raise ValueError(vt.strip("[]"))

                disease = "General visual description"
                confidence = 0.55
                disease_context = get_full_disease_context(disease, confidence, modality="basic")
                explanation = (
                    f"{vt}\n\n---\n**BASIC** mode uses general vision only (no clinical weight files). "
                    "Use **Skin / Chest / Eye / Brain** only for that type of medical image when weights are installed."
                )
                return {
                    "decision_layer": {"path": decision_path, "model": "vision-llm-basic"},
                    "prediction": {
                        "disease": disease,
                        "confidence": round(float(confidence), 4),
                        "modality": "basic",
                        "all_predictions": [],
                        "meets_threshold": False,
                    },
                    "doctor_mapping": disease_context["doctor"],
                    "treatment": disease_context.get("treatment", {}),
                    "tests": disease_context.get("tests", []),
                    "disease_info": disease_context.get("disease_info", {}),
                    "rag_llm_output": explanation,
                    "module_routes": {
                        "doctor_portal": "/doctor-dashboard",
                        "prescription_module": "/patient-prescriptions",
                        "pharmacy": "/pharmacy",
                        "lab_tests": "/lab-tests",
                        "medicine_reminders": "/medicine-reminder",
                        "health_tracking": "/health-tracking",
                        "admin_dashboard": "/admin-dashboard",
                    },
                    "disclaimer": (
                        "BASIC mode is for general image description only—not a medical diagnosis. "
                        "Consult a licensed professional for health decisions."
                    ),
                }

            prediction = self.image_pipeline.diagnosis_service.predict(image_data, modality=mod)
        else:
            decision_path = "text"
            prediction = self.symptom_service.predict(symptoms or "")

        disease = prediction["disease"]
        confidence = float(prediction["confidence"])
        resolved_modality = prediction.get("modality", mod if image_data else "text")

        context_modality = (
            "text"
            if not image_data
            else (mod if mod in ("skin", "chest", "eye", "brain") else "skin")
        )
        disease_context = get_full_disease_context(
            disease, confidence, modality=context_modality
        )

        # For text predictions that are not part of disease_mappings, keep specialist from symptom model.
        if decision_path == "text":
            disease_context["doctor"] = prediction.get("doctor", disease_context["doctor"])

        explanation = await self._generate_diagnosis_explanation(
            decision_path=decision_path,
            symptoms=symptoms,
            disease=disease,
            confidence=confidence,
            modality=resolved_modality,
            disease_context=disease_context,
        )

        img_meta = {}
        if decision_path == "image":
            try:
                img_meta = self.image_pipeline.diagnosis_service.model_metadata.get(mod, {})
            except Exception:
                img_meta = {}

        decision_model = (
            {
                "backbone": "EfficientNet-B0",
                "dataset": img_meta.get("dataset")
                or (
                    MEDMNIST_DATASET_ID.get(mod)
                    if mod in MEDMNIST_DATASET_ID
                    else "custom-weights"
                ),
                "multi_label": bool(img_meta.get("multi_label")),
            }
            if decision_path == "image"
            else {
                "backend": prediction.get("model_backend", self.symptom_service.model_kind),
                "family": "tfidf-logistic" if "sklearn" in self.symptom_service.model_kind else "keyword-rules",
            }
        )

        return {
            "decision_layer": {
                "path": decision_path,
                "model": decision_model,
            },
            "prediction": {
                "disease": disease,
                "confidence": round(confidence, 4),
                "modality": resolved_modality,
                "all_predictions": prediction.get("all_predictions", [])[:5],
                "meets_threshold": prediction.get("meets_threshold", confidence >= 0.6),
            },
            "doctor_mapping": disease_context["doctor"],
            "treatment": disease_context.get("treatment", {}),
            "tests": disease_context.get("tests", []),
            "disease_info": disease_context.get("disease_info", {}),
            "rag_llm_output": explanation,
            "module_routes": {
                "doctor_portal": "/doctor-dashboard",
                "prescription_module": "/patient-prescriptions",
                "pharmacy": "/pharmacy",
                "lab_tests": "/lab-tests",
                "medicine_reminders": "/medicine-reminder",
                "health_tracking": "/health-tracking",
                "admin_dashboard": "/admin-dashboard",
            },
            "disclaimer": (
                "This is an AI-assisted preliminary assessment and not a confirmed medical diagnosis. "
                "Please consult a licensed healthcare professional."
            ),
        }

    async def _generate_diagnosis_explanation(
        self,
        decision_path: str,
        symptoms: Optional[str],
        disease: str,
        confidence: float,
        modality: str,
        disease_context: dict,
    ) -> str:
        rag_context = ""
        if self.ai_service.rag_enabled and self.ai_service.rag_service:
            try:
                docs = await self.ai_service.rag_service.search_medical_knowledge(
                    query=f"{disease} symptoms diagnosis treatment specialist",
                    k=3,
                )
                if docs:
                    rag_context = "\n\n".join([f"- {d.get('content', '')[:300]}" for d in docs])
            except Exception as exc:
                logger.warning(f"RAG lookup failed: {exc}")

        prompt = (
            f"Diagnosis decision path: {decision_path} ({'image modality: ' + modality if decision_path == 'image' else 'symptom text model'}).\n"
            f"Predicted disease: {disease}\n"
            f"Confidence: {confidence:.1%}\n"
            f"Patient symptoms: {symptoms or 'Not provided'}\n"
            f"Recommended specialist: {disease_context.get('doctor', {}).get('specialty', 'General Physician')}\n"
            f"Suggested tests: {', '.join(disease_context.get('tests', []))}\n\n"
            f"RAG references:\n{rag_context or 'No external medical snippets available.'}\n\n"
            "Generate a comprehensive medical explanation with these sections:\n"
            "**1. Why This Prediction Was Made**\n"
            "Explain the clinical reasoning and key findings that led to this diagnosis.\n\n"
            "**2. What You Should Do Next**\n"
            "Provide clear next steps including specialist consultation and timeline.\n\n"
            "**3. Warning Signs**\n"
            "List red-flag symptoms that require immediate medical attention.\n\n"
            "**4. Using the App**\n"
            "Mention relevant modules: doctor appointments, prescriptions, pharmacy, lab tests, medicine reminders, health tracking.\n\n"
            "Keep the explanation clear, professional, and under 300 words. Use markdown formatting."
        )
        return await self.ai_service.get_simple_response(prompt, [])


_orchestrator_instance: Optional[DiagnosisOrchestratorService] = None


def get_diagnosis_orchestrator() -> DiagnosisOrchestratorService:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = DiagnosisOrchestratorService()
    return _orchestrator_instance

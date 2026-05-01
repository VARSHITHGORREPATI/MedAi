"""
End-to-end medical image pipeline.

This service turns an uploaded medical image into a structured result:
1. EfficientNet prediction
2. Disease context mapping
3. RAG retrieval for relevant medical knowledge
4. LLM explanation and precautions
"""

from __future__ import annotations

import logging
from typing import Optional

from models.disease_mappings import get_full_disease_context
from services.ai_service import AIService
from services.image_diagnosis_service import get_diagnosis_service

logger = logging.getLogger(__name__)


class MedicalImagePipelineService:
    def __init__(self) -> None:
        self.diagnosis_service = get_diagnosis_service()
        self.ai_service = AIService()

    async def analyze(
        self,
        image_data: bytes,
        modality: str = "skin",
        symptoms: Optional[str] = None,
    ) -> dict:
        prediction = self.diagnosis_service.predict(image_data, modality=modality)
        disease = prediction["disease"]
        confidence = prediction["confidence"]
        modality = prediction["modality"]
        disease_context = get_full_disease_context(disease, confidence, modality=modality)
        explanation = await self._generate_explanation(
            disease=disease,
            confidence=confidence,
            modality=modality,
            symptoms=symptoms,
            disease_context=disease_context,
        )

        return {
            "prediction": prediction,
            "modality": modality,
            "disease": disease,
            "confidence": round(confidence, 4),
            "meets_threshold": prediction["meets_threshold"],
            "all_predictions": [
                {
                    "disease": item["disease"],
                    "confidence": round(item["confidence"], 4),
                }
                for item in prediction["all_predictions"][:5]
            ],
            "doctor": disease_context["doctor"],
            "treatment": disease_context["treatment"],
            "tests": disease_context.get("tests", []),
            "disease_info": disease_context["disease_info"],
            "explanation": explanation,
            "disclaimer": self._get_disclaimer(prediction["meets_threshold"], confidence),
        }

    async def _generate_explanation(
        self,
        disease: str,
        confidence: float,
        modality: str,
        symptoms: Optional[str],
        disease_context: dict,
    ) -> str:
        try:
            prompt_parts = [
                f"Based on {modality} image analysis, the predicted condition is {disease} with {confidence:.1%} confidence.",
                "",
                "Disease Information:",
                f"- Medical Name: {disease_context['disease_info']['medical_name']}",
                f"- Description: {disease_context['disease_info']['description']}",
                f"- Typical Age: {disease_context['disease_info']['common_age']}",
                "",
                f"Recommended Specialist: {disease_context['doctor']['specialty']}",
                f"Urgency Level: {disease_context['doctor']['urgency']}",
                "",
                "Suggested Tests:",
            ]

            for test in disease_context.get("tests", []):
                prompt_parts.append(f"- {test}")

            if symptoms:
                prompt_parts.extend(["", f"Patient-reported symptoms: {symptoms}"])

            if self.ai_service.rag_enabled:
                try:
                    rag_documents = await self.ai_service.rag_service.search_medical_knowledge(
                        query=f"{disease} {modality} condition diagnosis treatment precautions",
                        k=3,
                    )
                    if rag_documents:
                        rag_context = "\n\n".join(
                            f"Reference {index + 1}: {document.get('content', '')}"
                            for index, document in enumerate(rag_documents)
                        )
                        prompt_parts.extend(["", "Medical Knowledge Base:", rag_context])
                except Exception as error:
                    logger.warning(f"RAG retrieval failed: {error}")

            prompt_parts.extend(
                [
                    "",
                    "Provide a clear, compassionate explanation for the patient covering:",
                    "1. What this condition is in simple terms",
                    "2. Why this diagnosis was suggested",
                    "3. What they should do next",
                    "4. Important precautions",
                    "",
                    "Keep it concise, empathetic, and emphasize professional medical consultation.",
                ]
            )

            prompt = "\n".join(prompt_parts)
            return await self.ai_service.get_simple_response(message=prompt, conversation_history=[])
        except Exception as error:
            logger.error(f"Error generating medical explanation: {error}")
            return self._fallback_explanation(disease, confidence, disease_context)

    @staticmethod
    def _fallback_explanation(disease: str, confidence: float, disease_context: dict) -> str:
        doctor = disease_context["doctor"]
        info = disease_context["disease_info"]
        tests = disease_context.get("tests", [])

        return (
            f"The image analysis suggests **{disease}** ({info['medical_name']}) with {confidence:.1%} confidence. "
            f"This is a preliminary AI assessment, not a final diagnosis.\n\n"
            f"Recommended specialist: {doctor['specialty']}. Urgency: {doctor['urgency']}.\n\n"
            f"Suggested tests: {', '.join(tests) if tests else 'clinical review and confirmatory testing as needed'}.\n\n"
            f"Next steps: follow the treatment guidance, monitor symptoms, and see a qualified clinician for confirmation."
        )

    @staticmethod
    def _get_disclaimer(meets_threshold: bool, confidence: float) -> str:
        disclaimer = (
            "⚠️ IMPORTANT MEDICAL DISCLAIMER: This is an AI-assisted preliminary assessment based on image analysis. "
            "It is NOT a medical diagnosis and should NOT replace professional medical advice, diagnosis, or treatment."
        )
        if not meets_threshold:
            disclaimer += (
                f"\n\n⚠️ LOW CONFIDENCE: The model confidence ({confidence:.1%}) is below the recommended threshold. "
                "Professional evaluation is especially important."
            )
        return disclaimer


_pipeline_instance: Optional[MedicalImagePipelineService] = None


def get_medical_image_pipeline() -> MedicalImagePipelineService:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = MedicalImagePipelineService()
    return _pipeline_instance

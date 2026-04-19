"""
Symptom diagnosis service (text branch of the decision layer).

Primary: TF-IDF + logistic regression (scikit-learn) when trained weights exist.
Fallback: weighted keyword scoring (same condition set).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Tuple

try:
    import joblib
except ImportError:  # pragma: no cover
    joblib = None  # type: ignore

logger = logging.getLogger(__name__)

_WEIGHTS_PATH = Path(__file__).resolve().parent.parent / "models" / "weights" / "symptom_text_clf.joblib"


class SymptomDiagnosisService:
    def __init__(self) -> None:
        self.condition_keywords: Dict[str, Dict[str, float]] = {
            "Flu": {
                "fever": 1.4,
                "chills": 1.2,
                "body pain": 1.1,
                "cough": 1.0,
                "fatigue": 0.9,
                "sore throat": 0.9,
            },
            "Migraine": {
                "headache": 1.3,
                "nausea": 1.0,
                "light sensitivity": 1.2,
                "sound sensitivity": 1.1,
                "throbbing": 1.0,
            },
            "Gastroenteritis": {
                "vomiting": 1.3,
                "diarrhea": 1.3,
                "stomach pain": 1.1,
                "abdominal pain": 1.1,
                "dehydration": 0.9,
                "nausea": 0.9,
            },
            "Hypertension": {
                "high bp": 1.3,
                "high blood pressure": 1.4,
                "dizziness": 0.8,
                "headache": 0.7,
                "blurred vision": 1.0,
            },
            "Diabetes": {
                "frequent urination": 1.2,
                "thirst": 1.1,
                "fatigue": 0.8,
                "blurred vision": 1.0,
                "high sugar": 1.3,
                "weight loss": 1.0,
            },
            "Allergic Rhinitis": {
                "sneezing": 1.2,
                "runny nose": 1.2,
                "itchy eyes": 1.1,
                "nasal congestion": 1.1,
                "allergy": 1.1,
            },
        }

        self.specialist_map: Dict[str, Dict[str, str]] = {
            "Flu": {"specialty": "General Physician", "urgency": "routine"},
            "Migraine": {"specialty": "Neurologist", "urgency": "soon"},
            "Gastroenteritis": {"specialty": "Gastroenterologist", "urgency": "soon"},
            "Hypertension": {"specialty": "Cardiologist", "urgency": "soon"},
            "Diabetes": {"specialty": "Endocrinologist", "urgency": "routine"},
            "Allergic Rhinitis": {"specialty": "ENT Specialist", "urgency": "routine"},
            "General Condition": {"specialty": "General Physician", "urgency": "routine"},
        }

        self._sklearn_pipeline = None
        self.model_kind = "keyword-rules"

        if joblib is not None and _WEIGHTS_PATH.is_file():
            try:
                self._sklearn_pipeline = joblib.load(_WEIGHTS_PATH)
                self.model_kind = "sklearn-tfidf-logistic"
                logger.info("Loaded symptom ML pipeline from %s", _WEIGHTS_PATH)
            except Exception as exc:  # pragma: no cover
                logger.warning("Could not load symptom ML weights: %s", exc)
                self._sklearn_pipeline = None
                self.model_kind = "keyword-rules"

    def predict(self, symptoms: str) -> Dict:
        text = (symptoms or "").strip().lower()
        if not text:
            raise ValueError("Symptoms text is required for text diagnosis.")

        if self._sklearn_pipeline is not None:
            return self._predict_sklearn(text)

        return self._predict_keywords(text)

    def _predict_sklearn(self, text: str) -> Dict:
        clf = self._sklearn_pipeline
        classes_attr = getattr(clf, "classes_", None)
        if classes_attr is not None:
            classes = list(classes_attr)
        else:
            classes = list(clf.named_steps["clf"].classes_)
        proba = clf.predict_proba([text])[0]
        order = proba.argsort()[::-1]
        top_i = int(order[0])
        top_condition = classes[top_i]
        top_p = float(proba[top_i])

        if top_p < 0.18 and "General Condition" in classes:
            top_condition = "General Condition"
            top_p = max(top_p, 0.28)

        all_predictions = [
            {"disease": classes[int(i)], "confidence": round(float(proba[int(i)]), 4)}
            for i in order[: min(6, len(classes))]
        ]

        confidence = min(0.92, max(0.38, top_p))
        specialist = self.specialist_map.get(top_condition, self.specialist_map["General Condition"])

        return {
            "modality": "text",
            "disease": top_condition,
            "confidence": round(confidence, 4),
            "all_predictions": all_predictions,
            "meets_threshold": confidence >= 0.55,
            "doctor": {
                "specialty": specialist["specialty"],
                "urgency": specialist["urgency"],
                "consultation_type": "in-person or teleconsultation",
                "description": "Specialist suggestion from symptom ML model (TF-IDF + logistic).",
            },
            "model_backend": self.model_kind,
        }

    def _predict_keywords(self, text: str) -> Dict:
        scored: List[Tuple[str, float]] = []
        for condition, keywords in self.condition_keywords.items():
            score = 0.0
            for keyword, weight in keywords.items():
                if keyword in text:
                    score += weight
            scored.append((condition, score))

        scored.sort(key=lambda item: item[1], reverse=True)
        top_condition, top_score = scored[0]
        total_positive = sum(max(0.0, item[1]) for item in scored)

        if top_score <= 0:
            top_condition = "General Condition"
            confidence = 0.35
        else:
            confidence = min(0.92, max(0.45, top_score / (total_positive + 0.5)))

        all_predictions = [
            {
                "disease": condition,
                "confidence": round(
                    (score / (total_positive + 0.5)) if total_positive > 0 else 0.0,
                    4,
                ),
            }
            for condition, score in scored[:5]
        ]

        specialist = self.specialist_map.get(top_condition, self.specialist_map["General Condition"])

        return {
            "modality": "text",
            "disease": top_condition,
            "confidence": round(confidence, 4),
            "all_predictions": all_predictions,
            "meets_threshold": confidence >= 0.6,
            "doctor": {
                "specialty": specialist["specialty"],
                "urgency": specialist["urgency"],
                "consultation_type": "in-person or teleconsultation",
                "description": "Specialist suggested from symptom-based keyword model.",
            },
            "model_backend": self.model_kind,
        }


_symptom_service_instance: SymptomDiagnosisService | None = None


def get_symptom_diagnosis_service() -> SymptomDiagnosisService:
    global _symptom_service_instance
    if _symptom_service_instance is None:
        _symptom_service_instance = SymptomDiagnosisService()
    return _symptom_service_instance

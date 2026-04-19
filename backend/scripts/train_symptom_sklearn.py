"""
Train TF-IDF + logistic regression on synthetic symptom phrases (same labels as SymptomDiagnosisService).
Saves: backend/models/weights/symptom_text_clf.joblib

Run from repo root:
  cd backend && python scripts/train_symptom_sklearn.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# (text, label) — short synthetic dataset for a deployable baseline; extend with real data for production.
TRAINING_PAIRS: list[tuple[str, str]] = [
    ("fever chills body ache cough fatigue sore throat", "Flu"),
    ("high temperature runny nose cough tired", "Flu"),
    ("influenza like symptoms muscle pain", "Flu"),
    ("severe headache nausea light hurts eyes throbbing one side", "Migraine"),
    ("migraine aura sound sensitivity photophobia", "Migraine"),
    ("pulsating headache vomiting", "Migraine"),
    ("vomiting diarrhea stomach cramps dehydration watery stool", "Gastroenteritis"),
    ("abdominal pain nausea food poisoning", "Gastroenteritis"),
    ("upset stomach loose motions", "Gastroenteritis"),
    ("high blood pressure dizzy blurred vision", "Hypertension"),
    ("high bp chest tightness", "Hypertension"),
    ("elevated blood pressure reading", "Hypertension"),
    ("frequent urination thirsty tired high blood sugar", "Diabetes"),
    ("polyuria polydipsia fatigue glucose", "Diabetes"),
    ("blurred vision thirst weight loss diabetes", "Diabetes"),
    ("sneezing itchy eyes runny nose allergy pollen", "Allergic Rhinitis"),
    ("nasal congestion seasonal allergies", "Allergic Rhinitis"),
    ("stuffy nose allergic", "Allergic Rhinitis"),
    ("routine checkup feel okay no major issues", "General Condition"),
    ("just a question not feeling sick", "General Condition"),
    ("general wellness question", "General Condition"),
]


def main() -> None:
    out_dir = os.path.join(os.path.dirname(__file__), "..", "models", "weights")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "symptom_text_clf.joblib")

    texts = [t for t, _ in TRAINING_PAIRS]
    labels = [y for _, y in TRAINING_PAIRS]

    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=4096)),
            (
                "clf",
                LogisticRegression(
                    max_iter=400,
                    class_weight="balanced",
                    solver="lbfgs",
                ),
            ),
        ]
    )
    pipeline.fit(texts, labels)
    joblib.dump(pipeline, out_path)
    print(f"[OK] Saved symptom classifier to {out_path}")
    print(f"     Classes: {list(pipeline.classes_)}")


if __name__ == "__main__":
    main()

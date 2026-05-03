"""
Multimodal Medical Diagnosis Service
Combines image-based and symptom-based diagnosis with confidence-based decision system

Input: Medical image + Symptom text
Process: EfficientNet + ML classifier + Weighted fusion
Output: Disease + Confidence + Doctor recommendation + Prescription guidance
"""

import torch
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Optional, Tuple
from PIL import Image
import io
import joblib
from pathlib import Path

from .image_diagnosis_service import ImageDiagnosisService
from .symptom_diagnosis_service import SymptomDiagnosisService


class MultimodalDiagnosisService:
    """
    Multimodal diagnosis combining image and symptom analysis
    
    Architecture:
    1. Image pathway: EfficientNet → disease probability
    2. Text pathway: ML classifier → disease probability  
    3. Fusion: Weighted average of both predictions
    4. Confidence system: Threshold-based decision
    5. Output: Structured medical recommendation
    """
    
    def __init__(
        self,
        image_service: Optional[ImageDiagnosisService] = None,
        symptom_service: Optional[SymptomDiagnosisService] = None,
        fusion_alpha: float = 0.6,  # Weight for image model
        confidence_threshold: float = 0.75,
        high_confidence_threshold: float = 0.90
    ):
        """
        Initialize multimodal diagnosis service
        
        Args:
            image_service: Image diagnosis service (EfficientNet)
            symptom_service: Symptom diagnosis service (ML classifier)
            fusion_alpha: Weight for image prediction (0-1)
                         final = alpha*image + (1-alpha)*symptom
            confidence_threshold: Minimum confidence for diagnosis
            high_confidence_threshold: Threshold for high confidence
        """
        self.image_service = image_service or ImageDiagnosisService()
        self.symptom_service = symptom_service or SymptomDiagnosisService()
        
        self.fusion_alpha = fusion_alpha
        self.confidence_threshold = confidence_threshold
        self.high_confidence_threshold = high_confidence_threshold
        
        # Disease mapping for consistent labels
        self.disease_mapping = self._load_disease_mapping()
    
    def _load_disease_mapping(self) -> Dict[str, str]:
        """Load disease label mapping for consistency"""
        # Map between image and symptom disease labels
        return {
            # Skin conditions
            "melanoma": "melanoma",
            "basal_cell_carcinoma": "skin_cancer",
            "actinic_keratosis": "skin_lesion",
            
            # Chest conditions  
            "pneumonia": "pneumonia",
            "covid19": "covid_19",
            "tuberculosis": "tuberculosis",
            
            # Add more mappings as needed
        }
    
    def diagnose_multimodal(
        self,
        image_bytes: Optional[bytes] = None,
        symptoms: Optional[str] = None,
        modality: str = "auto",
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None
    ) -> Dict:
        """
        Perform multimodal diagnosis combining image and symptoms
        
        Args:
            image_bytes: Medical image as bytes
            symptoms: Comma-separated symptom string
            modality: Image modality (skin, chest, etc.)
            patient_age: Patient age for context
            patient_gender: Patient gender for context
            
        Returns:
            Structured diagnosis result with confidence and recommendations
        """
        
        # Step 1: Get predictions from both modalities
        image_result = None
        symptom_result = None
        
        if image_bytes:
            image_result = self._get_image_prediction(image_bytes, modality)
        
        if symptoms:
            symptom_result = self._get_symptom_prediction(symptoms)
        
        # Check if we got any valid results
        if not image_result and not symptom_result:
            return {
                "error": "Prediction failed",
                "message": "Unable to generate predictions from provided inputs. Please check the data and try again."
            }
        
        # Step 2: Determine diagnosis mode
        if image_result and symptom_result:
            # Multimodal fusion
            result = self._fuse_predictions(image_result, symptom_result)
            result["mode"] = "multimodal"
            result["fusion_method"] = f"weighted_average(alpha={self.fusion_alpha})"
        elif image_result:
            # Image-only
            result = self._format_single_modality(image_result, "image")
            result["mode"] = "image_only"
        elif symptom_result:
            # Symptom-only
            result = self._format_single_modality(symptom_result, "symptom")
            result["mode"] = "symptom_only"
        else:
            return {
                "error": "No input provided",
                "message": "Please provide either medical image or symptoms"
            }
        
        # Step 3: Apply confidence-based decision system
        result = self._apply_confidence_system(result)
        
        # Step 4: Add clinical context
        result = self._add_clinical_context(
            result, 
            patient_age=patient_age,
            patient_gender=patient_gender
        )
        
        # Step 5: Generate recommendations
        result = self._generate_recommendations(result)
        
        return result
    
    def _get_image_prediction(self, image_bytes: bytes, modality: str) -> Dict:
        """Get prediction from image model"""
        try:
            # Auto-detect modality if set to "auto"
            if modality == "auto":
                from services.modality_detector import get_modality_detector
                detector = get_modality_detector()
                detected_modality, confidence, details = detector.detect_from_image(image_bytes)
                modality = detected_modality
                print(f"🔍 Auto-detected modality: {modality} (confidence: {confidence:.2f})")
            
            result = self.image_service.predict(
                image_data=image_bytes,
                modality=modality
            )
            return {
                "disease": result.get("disease"),
                "confidence": result.get("confidence", 0.0),
                "probabilities": result.get("all_predictions", []),
                "modality": result.get("modality")
            }
        except Exception as e:
            print(f"Image prediction error: {e}")
            return None
    
    def _get_symptom_prediction(self, symptoms: str) -> Dict:
        """Get prediction from symptom model"""
        try:
            result = self.symptom_service.predict(symptoms)
            return {
                "disease": result.get("disease"),
                "confidence": result.get("confidence", 0.0),
                "probabilities": result.get("all_predictions", []),
                "modality": "text"
            }
        except Exception as e:
            print(f"Symptom prediction error: {e}")
            # Return None to indicate failure
            return None
    
    def _fuse_predictions(
        self, 
        image_result: Dict, 
        symptom_result: Dict
    ) -> Dict:
        """
        Fuse image and symptom predictions using weighted average
        
        Fusion formula:
        final_score = alpha * image_confidence + (1 - alpha) * symptom_confidence
        
        If diseases match: Use weighted average
        If diseases differ: Use higher confidence or weighted voting
        """
        
        image_disease = image_result["disease"]
        symptom_disease = symptom_result["disease"]
        
        image_conf = image_result["confidence"]
        symptom_conf = symptom_result["confidence"]
        
        # Case 1: Both models agree on disease
        if self._diseases_match(image_disease, symptom_disease):
            fused_confidence = (
                self.fusion_alpha * image_conf + 
                (1 - self.fusion_alpha) * symptom_conf
            )
            
            return {
                "predicted_disease": image_disease,
                "confidence": fused_confidence,
                "agreement": "high",
                "image_prediction": {
                    "disease": image_disease,
                    "confidence": image_conf
                },
                "symptom_prediction": {
                    "disease": symptom_disease,
                    "confidence": symptom_conf
                },
                "fusion_note": "Both modalities agree on diagnosis"
            }
        
        # Case 2: Models disagree - use confidence-based selection
        else:
            # Calculate weighted scores
            image_score = self.fusion_alpha * image_conf
            symptom_score = (1 - self.fusion_alpha) * symptom_conf
            
            if image_score > symptom_score:
                primary_disease = image_disease
                primary_conf = image_conf
                secondary_disease = symptom_disease
                secondary_conf = symptom_conf
                primary_source = "image"
            else:
                primary_disease = symptom_disease
                primary_conf = symptom_conf
                secondary_disease = image_disease
                secondary_conf = image_conf
                primary_source = "symptom"
            
            # Reduce confidence due to disagreement
            disagreement_penalty = 0.15
            fused_confidence = max(
                primary_conf - disagreement_penalty,
                0.5
            )
            
            return {
                "predicted_disease": primary_disease,
                "confidence": fused_confidence,
                "agreement": "low",
                "primary_source": primary_source,
                "image_prediction": {
                    "disease": image_disease,
                    "confidence": image_conf
                },
                "symptom_prediction": {
                    "disease": symptom_disease,
                    "confidence": symptom_conf
                },
                "alternative_diagnosis": {
                    "disease": secondary_disease,
                    "confidence": secondary_conf
                },
                "fusion_note": "Models disagree - using higher confidence prediction with penalty"
            }
    
    def _diseases_match(self, disease1: str, disease2: str) -> bool:
        """Check if two disease labels refer to same condition"""
        # Normalize disease names
        d1 = disease1.lower().replace(" ", "_").replace("-", "_")
        d2 = disease2.lower().replace(" ", "_").replace("-", "_")
        
        # Direct match
        if d1 == d2:
            return True
        
        # Check mapping
        mapped_d1 = self.disease_mapping.get(d1, d1)
        mapped_d2 = self.disease_mapping.get(d2, d2)
        
        return mapped_d1 == mapped_d2
    
    def _format_single_modality(self, result: Dict, source: str) -> Dict:
        """Format single modality result"""
        return {
            "predicted_disease": result["disease"],
            "confidence": result["confidence"],
            "agreement": "n/a",
            f"{source}_prediction": result,
            "fusion_note": f"Single modality diagnosis ({source} only)"
        }
    
    def _apply_confidence_system(self, result: Dict) -> Dict:
        """
        Apply confidence-based decision system
        
        Confidence levels:
        - High (>= 0.90): Strong recommendation
        - Medium (0.75-0.90): Moderate recommendation  
        - Low (< 0.75): Consult doctor required
        """
        
        confidence = result["confidence"]
        
        if confidence >= self.high_confidence_threshold:
            result["confidence_level"] = "high"
            result["action"] = "preliminary_diagnosis"
            result["requires_doctor"] = False
            result["urgency"] = "routine"
        elif confidence >= self.confidence_threshold:
            result["confidence_level"] = "medium"
            result["action"] = "probable_diagnosis"
            result["requires_doctor"] = True
            result["urgency"] = "recommended"
        else:
            result["confidence_level"] = "low"
            result["action"] = "consult_doctor"
            result["requires_doctor"] = True
            result["urgency"] = "important"
        
        return result
    
    def _add_clinical_context(
        self, 
        result: Dict,
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None
    ) -> Dict:
        """Add clinical context from disease mapping"""
        
        disease = result["predicted_disease"]
        
        # Get modality from result or default to skin
        modality = result.get("modality", "skin")
        
        # Import the correct function
        from models.disease_mappings import get_full_disease_context
        
        context = get_full_disease_context(
            disease=disease,
            confidence=result.get("confidence", 0.0),
            modality=modality
        )
        
        if context:
            result["doctor_specialty"] = context.get("doctor", {}).get("specialty")
            result["treatment_context"] = context.get("treatment")
            result["suggested_tests"] = context.get("tests", [])
            result["disease_info"] = context.get("disease_info")
        
        # Add patient-specific context
        if patient_age or patient_gender:
            result["patient_context"] = {
                "age": patient_age,
                "gender": patient_gender,
                "risk_factors": self._assess_risk_factors(
                    disease, patient_age, patient_gender
                )
            }
        
        return result
    
    def _assess_risk_factors(
        self,
        disease: str,
        age: Optional[int],
        gender: Optional[str]
    ) -> List[str]:
        """Assess patient-specific risk factors"""
        risk_factors = []
        
        if age:
            if age > 60:
                risk_factors.append("Advanced age increases risk")
            elif age < 18:
                risk_factors.append("Pediatric case - special consideration needed")
        
        # Add disease-specific risk factors
        # This can be expanded based on medical knowledge
        
        return risk_factors
    
    def _generate_recommendations(self, result: Dict) -> Dict:
        """Generate actionable recommendations"""
        
        confidence_level = result.get("confidence_level")
        disease = result.get("predicted_disease")
        
        recommendations = []
        
        # Confidence-based recommendations
        if confidence_level == "high":
            recommendations.append(
                f"High confidence diagnosis of {disease}. "
                "Recommend consultation with specialist for confirmation."
            )
        elif confidence_level == "medium":
            recommendations.append(
                f"Probable diagnosis of {disease}. "
                "Medical consultation strongly recommended for confirmation."
            )
        else:
            recommendations.append(
                f"Low confidence prediction. "
                "Immediate medical consultation required for proper diagnosis."
            )
        
        # Add specialist recommendation
        if result.get("doctor_specialty"):
            recommendations.append(
                f"Consult: {result['doctor_specialty']}"
            )
        
        # Add test recommendations
        if result.get("suggested_tests"):
            tests = ", ".join(result["suggested_tests"][:3])
            recommendations.append(f"Suggested tests: {tests}")
        
        # Add urgency note
        if result.get("urgency") == "important":
            recommendations.append(
                "⚠️ Important: Seek medical attention promptly"
            )
        
        result["recommendations"] = recommendations
        
        # Add disclaimer
        result["disclaimer"] = (
            "This is a preliminary AI-assisted assessment and NOT a medical diagnosis. "
            "Always consult qualified healthcare professionals for proper diagnosis and treatment."
        )
        
        return result
    
    def get_fusion_weights(self) -> Dict[str, float]:
        """Get current fusion weights"""
        return {
            "image_weight": self.fusion_alpha,
            "symptom_weight": 1 - self.fusion_alpha
        }
    
    def set_fusion_weights(self, image_weight: float):
        """Update fusion weights"""
        if not 0 <= image_weight <= 1:
            raise ValueError("Image weight must be between 0 and 1")
        self.fusion_alpha = image_weight
    
    def get_confidence_thresholds(self) -> Dict[str, float]:
        """Get current confidence thresholds"""
        return {
            "minimum": self.confidence_threshold,
            "high": self.high_confidence_threshold
        }


# Convenience function for quick diagnosis
def diagnose_multimodal(
    image_bytes: Optional[bytes] = None,
    symptoms: Optional[str] = None,
    modality: str = "auto",
    **kwargs
) -> Dict:
    """
    Quick multimodal diagnosis function
    
    Example usage:
        result = diagnose_multimodal(
            image_bytes=image_data,
            symptoms="fever, cough, fatigue",
            modality="chest"
        )
    """
    service = MultimodalDiagnosisService()
    return service.diagnose_multimodal(
        image_bytes=image_bytes,
        symptoms=symptoms,
        modality=modality,
        **kwargs
    )

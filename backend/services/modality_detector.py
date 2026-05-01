"""
Automatic Modality Detection Service
Detects the appropriate medical image modality (skin, chest, eye, brain) 
based on image characteristics or symptom text
"""

import io
import numpy as np
from PIL import Image
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class ModalityDetector:
    """
    Automatically detect medical image modality
    
    Detection methods:
    1. Image-based: Analyze image characteristics (color, size, patterns)
    2. Symptom-based: Keyword matching from symptom text
    3. Hybrid: Combine both approaches
    """
    
    def __init__(self):
        # Symptom keywords for each modality
        self.symptom_keywords = {
            "skin": [
                "rash", "lesion", "mole", "spot", "itch", "skin", "derma", 
                "melanoma", "acne", "eczema", "psoriasis", "burn", "wound",
                "pigmentation", "discoloration", "bump", "growth", "wart"
            ],
            "chest": [
                "cough", "breathing", "chest", "lung", "pneumonia", "covid",
                "tuberculosis", "bronchitis", "asthma", "shortness of breath",
                "wheezing", "respiratory", "x-ray", "thorax", "pulmonary"
            ],
            "eye": [
                "vision", "eye", "retina", "blind", "sight", "oct", "ophthalmology",
                "cataract", "glaucoma", "macular", "diabetic retinopathy",
                "blurry", "floaters", "visual", "optic"
            ],
            "brain": [
                "brain", "head", "neurological", "ct", "mri", "scan",
                "headache", "migraine", "stroke", "tumor", "seizure",
                "organ", "abdominal", "liver", "kidney", "spleen"
            ]
        }
        
        # Image characteristics for each modality
        self.image_characteristics = {
            "skin": {
                "typical_size": (224, 224),
                "color_mode": "RGB",
                "has_color": True,
                "typical_aspect_ratio": (0.8, 1.2),
                "description": "Close-up photos of skin lesions, typically colorful"
            },
            "chest": {
                "typical_size": (224, 224),
                "color_mode": "L",  # Grayscale
                "has_color": False,
                "typical_aspect_ratio": (0.7, 1.3),
                "description": "X-ray images, typically grayscale with rib structures"
            },
            "eye": {
                "typical_size": (224, 224),
                "color_mode": "L",  # Grayscale
                "has_color": False,
                "typical_aspect_ratio": (0.9, 1.1),
                "description": "OCT scans, grayscale with layered retinal structures"
            },
            "brain": {
                "typical_size": (224, 224),
                "color_mode": "L",  # Grayscale
                "has_color": False,
                "typical_aspect_ratio": (0.8, 1.2),
                "description": "CT scans of organs, grayscale cross-sections"
            }
        }
    
    def detect_from_image(self, image_bytes: bytes) -> Tuple[str, float, Dict]:
        """
        Detect modality from image characteristics
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Tuple of (modality, confidence, analysis_details)
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # Analyze image characteristics
            analysis = self._analyze_image(image)
            
            # Score each modality
            scores = {}
            for modality in ["skin", "chest", "eye", "brain"]:
                scores[modality] = self._score_modality(analysis, modality)
            
            # Get best match
            best_modality = max(scores, key=scores.get)
            confidence = scores[best_modality]
            
            # Force output with print for debugging
            print(f"\n🔍 MODALITY DETECTION:")
            print(f"   Best: {best_modality} (confidence: {confidence:.2f})")
            print(f"   Scores: skin={scores['skin']:.2f}, chest={scores['chest']:.2f}, eye={scores['eye']:.2f}, brain={scores['brain']:.2f}")
            print(f"   Image: grayscale={analysis['is_grayscale']}, brightness={analysis['brightness']:.1f}, contrast={analysis['contrast']:.1f}")
            print(f"   Features: edge_density={analysis.get('edge_density', 0):.1f}, entropy={analysis.get('entropy', 0):.2f}, hist_peaks={analysis.get('hist_peaks', 0)}\n")
            
            logger.info(f"🔍 Image modality detection: {best_modality} (confidence: {confidence:.2f})")
            logger.info(f"   All scores: skin={scores['skin']:.2f}, chest={scores['chest']:.2f}, eye={scores['eye']:.2f}, brain={scores['brain']:.2f}")
            logger.info(f"   Image: grayscale={analysis['is_grayscale']}, brightness={analysis['brightness']:.1f}, contrast={analysis['contrast']:.1f}")
            logger.info(f"   Features: edge_density={analysis.get('edge_density', 0):.1f}, entropy={analysis.get('entropy', 0):.2f}, hist_peaks={analysis.get('hist_peaks', 0)}")
            
            return best_modality, confidence, {
                "scores": scores,
                "analysis": analysis,
                "method": "image_analysis"
            }
            
        except Exception as e:
            logger.error(f"Error detecting modality from image: {e}")
            import traceback
            print(f"\n❌ MODALITY DETECTION ERROR: {e}")
            print(traceback.format_exc())
            logger.error(traceback.format_exc())
            # Default to skin if detection fails
            return "skin", 0.5, {"error": str(e), "method": "fallback"}
    
    def detect_from_symptoms(self, symptoms: str) -> Tuple[str, float, Dict]:
        """
        Detect modality from symptom text
        
        Args:
            symptoms: Symptom description text
            
        Returns:
            Tuple of (modality, confidence, analysis_details)
        """
        if not symptoms:
            return "skin", 0.5, {"method": "default"}
        
        symptoms_lower = symptoms.lower()
        
        # Count keyword matches for each modality
        matches = {}
        for modality, keywords in self.symptom_keywords.items():
            count = sum(1 for keyword in keywords if keyword in symptoms_lower)
            matches[modality] = count
        
        # Calculate confidence based on matches
        total_matches = sum(matches.values())
        if total_matches == 0:
            # No clear match, default to skin
            return "skin", 0.5, {"matches": matches, "method": "symptom_keywords"}
        
        best_modality = max(matches, key=matches.get)
        confidence = min(matches[best_modality] / max(total_matches, 1), 1.0)
        
        # Boost confidence if there are multiple matches for the same modality
        if matches[best_modality] >= 2:
            confidence = min(confidence + 0.2, 1.0)
        
        logger.info(f"Symptom modality detection: {best_modality} (confidence: {confidence:.2f})")
        
        return best_modality, confidence, {
            "matches": matches,
            "method": "symptom_keywords"
        }
    
    def detect_hybrid(
        self, 
        image_bytes: Optional[bytes] = None,
        symptoms: Optional[str] = None
    ) -> Tuple[str, float, Dict]:
        """
        Detect modality using both image and symptoms
        
        Args:
            image_bytes: Raw image bytes (optional)
            symptoms: Symptom description (optional)
            
        Returns:
            Tuple of (modality, confidence, analysis_details)
        """
        image_result = None
        symptom_result = None
        
        # Get predictions from both sources
        if image_bytes:
            image_modality, image_conf, image_details = self.detect_from_image(image_bytes)
            image_result = (image_modality, image_conf, image_details)
        
        if symptoms:
            symptom_modality, symptom_conf, symptom_details = self.detect_from_symptoms(symptoms)
            symptom_result = (symptom_modality, symptom_conf, symptom_details)
        
        # Combine results
        if image_result and symptom_result:
            # Both available - use weighted combination
            img_mod, img_conf, img_det = image_result
            sym_mod, sym_conf, sym_det = symptom_result
            
            # If both agree, high confidence
            if img_mod == sym_mod:
                combined_conf = min((img_conf + sym_conf) / 2 + 0.2, 1.0)
                return img_mod, combined_conf, {
                    "image": img_det,
                    "symptom": sym_det,
                    "agreement": "high",
                    "method": "hybrid_agreement"
                }
            
            # If they disagree, use higher confidence
            if img_conf > sym_conf:
                return img_mod, img_conf * 0.9, {
                    "image": img_det,
                    "symptom": sym_det,
                    "agreement": "low",
                    "primary": "image",
                    "method": "hybrid_image_priority"
                }
            else:
                return sym_mod, sym_conf * 0.9, {
                    "image": img_det,
                    "symptom": sym_det,
                    "agreement": "low",
                    "primary": "symptom",
                    "method": "hybrid_symptom_priority"
                }
        
        elif image_result:
            return image_result
        elif symptom_result:
            return symptom_result
        else:
            # No input, default to skin
            return "skin", 0.5, {"method": "default"}
    
    def _analyze_image(self, image: Image.Image) -> Dict:
        """Analyze image characteristics"""
        # Convert to numpy array
        img_array = np.array(image)
        
        # Basic characteristics
        width, height = image.size
        aspect_ratio = width / height if height > 0 else 1.0
        
        # Color analysis
        is_grayscale = len(img_array.shape) == 2 or (
            len(img_array.shape) == 3 and img_array.shape[2] == 1
        )
        
        if not is_grayscale and len(img_array.shape) == 3:
            # Check if image is effectively grayscale (all channels similar)
            # More lenient check - real color images have significant channel differences
            if img_array.shape[2] >= 3:
                r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
                
                # Calculate color variance across the image
                r_mean, g_mean, b_mean = np.mean(r), np.mean(g), np.mean(b)
                color_variance = np.std([r_mean, g_mean, b_mean])
                
                # Also check pixel-level color differences
                pixel_color_diff = np.mean(np.abs(r.astype(float) - g.astype(float))) + \
                                  np.mean(np.abs(g.astype(float) - b.astype(float))) + \
                                  np.mean(np.abs(r.astype(float) - b.astype(float)))
                
                # If color variance is very low AND pixel differences are small, it's grayscale
                # Increased thresholds to be more lenient - real color images have much higher variance
                is_effectively_grayscale = (color_variance < 3) and (pixel_color_diff < 10)
                
                # Log color analysis for debugging
                logger.debug(f"Color analysis: variance={color_variance:.2f}, pixel_diff={pixel_color_diff:.2f}, is_gray={is_effectively_grayscale}")
            else:
                is_effectively_grayscale = True
        else:
            is_effectively_grayscale = True
        
        # Brightness analysis
        if is_grayscale or is_effectively_grayscale:
            if len(img_array.shape) == 3:
                gray_channel = img_array[:,:,0]
            else:
                gray_channel = img_array
        else:
            # For color images, convert to grayscale for analysis
            gray_channel = np.mean(img_array, axis=2) if len(img_array.shape) == 3 else img_array
        
        brightness = np.mean(gray_channel)
        contrast = np.std(gray_channel)
        
        # Additional features for better discrimination
        # Edge density - chest X-rays have more edges (ribs, lung boundaries)
        from scipy import ndimage
        edges = ndimage.sobel(gray_channel.astype(float))
        edge_density = np.mean(np.abs(edges))
        
        # Histogram analysis - distribution of pixel intensities
        hist, _ = np.histogram(gray_channel.flatten(), bins=50, range=(0, 256))
        hist_normalized = hist / np.sum(hist)
        
        # Entropy - measure of randomness/complexity
        hist_nonzero = hist_normalized[hist_normalized > 0]
        entropy = -np.sum(hist_nonzero * np.log2(hist_nonzero))
        
        # Peak detection - chest X-rays often have bimodal distribution (dark lungs, bright bones)
        # Eye scans have more uniform distribution
        hist_peaks = np.sum(hist_normalized > 0.05)  # Count significant peaks
        
        return {
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "is_grayscale": is_grayscale or is_effectively_grayscale,
            "brightness": float(brightness),
            "contrast": float(contrast),
            "edge_density": float(edge_density),
            "entropy": float(entropy),
            "hist_peaks": int(hist_peaks),
            "mode": image.mode
        }
    
    def _score_modality(self, analysis: Dict, modality: str) -> float:
        """
        Score how well the image matches a modality
        
        Returns score between 0 and 1
        """
        score = 0.0
        characteristics = self.image_characteristics[modality]
        
        # Color mode score (MOST IMPORTANT - 50% weight)
        if modality == "skin":
            # Skin images should be colorful RGB
            if not analysis["is_grayscale"]:
                score += 0.5  # Very strong indicator for skin
            else:
                score += 0.0  # Grayscale images are NOT skin
        else:
            # Chest, eye, brain should be grayscale
            if analysis["is_grayscale"]:
                score += 0.3  # Good indicator for medical scans
            else:
                score += 0.0  # Color images are not medical scans
        
        # Aspect ratio score (5% weight)
        expected_ratio = characteristics["typical_aspect_ratio"]
        actual_ratio = analysis["aspect_ratio"]
        if expected_ratio[0] <= actual_ratio <= expected_ratio[1]:
            score += 0.05
        
        # Brightness and contrast patterns (20% weight)
        brightness = analysis["brightness"]
        contrast = analysis["contrast"]
        
        if modality == "skin":
            # Skin images: typically bright with high contrast and color variation
            if 80 < brightness < 220:
                score += 0.1
            if contrast > 30:
                score += 0.1
        
        elif modality == "chest":
            # X-rays: wide brightness range, moderate-high contrast
            if 60 < brightness < 180:
                score += 0.10
            if 30 < contrast < 80:
                score += 0.10
        
        elif modality == "eye":
            # OCT scans: moderate brightness, moderate contrast
            if 50 < brightness < 150:
                score += 0.08
            if 20 < contrast < 60:
                score += 0.07
        
        elif modality == "brain":
            # CT scans: moderate brightness, moderate contrast
            if 40 < brightness < 140:
                score += 0.1
            if 15 < contrast < 55:
                score += 0.1
        
        # Advanced features (25% weight) - only for grayscale images
        if analysis["is_grayscale"]:
            edge_density = analysis.get("edge_density", 0)
            entropy = analysis.get("entropy", 0)
            hist_peaks = analysis.get("hist_peaks", 0)
            
            if modality == "chest":
                # Chest X-rays: Variable edge density (5-20), high entropy (>4.5)
                # Key: High entropy is the main discriminator
                if entropy > 4.8:
                    score += 0.15  # Strong indicator
                elif entropy > 4.0:
                    score += 0.08
                
                # Edge density - chest can vary widely
                if 5 < edge_density < 25:
                    score += 0.05
                
                # Brightness in chest range
                if 80 < brightness < 160:
                    score += 0.05
            
            elif modality == "eye":
                # Eye OCT: Lower entropy (<5.0), smoother appearance
                if entropy < 5.0:
                    score += 0.10
                elif entropy < 5.5:
                    score += 0.05
                
                # Lower edge density
                if edge_density < 15:
                    score += 0.08
                
                # Moderate brightness
                if 60 < brightness < 140:
                    score += 0.07
            
            elif modality == "brain":
                # Brain CT: Moderate entropy, moderate edge density
                if 4.0 < entropy < 5.5:
                    score += 0.10
                
                if 8 < edge_density < 20:
                    score += 0.08
                
                if 50 < brightness < 130:
                    score += 0.07
        
        return min(score, 1.0)


# Singleton instance
_modality_detector = None

def get_modality_detector() -> ModalityDetector:
    """Get or create singleton modality detector instance"""
    global _modality_detector
    if _modality_detector is None:
        _modality_detector = ModalityDetector()
    return _modality_detector

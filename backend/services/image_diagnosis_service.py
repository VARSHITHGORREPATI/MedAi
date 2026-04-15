"""
Medical Image Diagnosis Service using EfficientNet.
Supports modality-specific inference for skin, chest, eye, and brain images.
"""

import os
import io
import logging
from typing import Dict, Optional

import timm
import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms

logger = logging.getLogger(__name__)


class ImageDiagnosisService:
    """
    Service for medical image classification using EfficientNet-B0
    Predicts diseases from uploaded medical images by modality.
    """

    MODALITY_CONFIG = {
        "skin": {
            "model_path": "backend/models/weights/efficientnet_skin_disease.pth",
            "default_backbone": "efficientnet_b0",
            "default_image_size": 224,
            "disease_classes": [
                "Acne",
                "Eczema",
                "Melanoma",
                "Psoriasis",
                "Vitiligo",
                "Rosacea",
                "Normal",
            ],
        },
        "chest": {
            "model_path": "backend/models/weights/efficientnet_chest_disease.pth",
            "default_backbone": "efficientnet_b0",
            "default_image_size": 224,
            "disease_classes": [
                "Atelectasis",
                "Cardiomegaly",
                "Effusion",
                "Infiltration",
                "Mass",
                "Nodule",
                "Pneumonia",
                "Pneumothorax",
                "Consolidation",
                "Edema",
                "Emphysema",
                "Fibrosis",
                "Pleural Thickening",
                "Hernia",
            ],
        },
        "eye": {
            "model_path": "backend/models/weights/efficientnet_eye_disease.pth",
            "default_backbone": "efficientnet_b0",
            "default_image_size": 224,
            "disease_classes": [
                "Normal",
                "Diabetic Retinopathy",
                "Glaucoma",
                "Cataract",
                "Age-related Macular Degeneration",
                "Hypertension",
                "Myopia",
                "Other Abnormalities",
            ],
        },
        "brain": {
            "model_path": "backend/models/weights/efficientnet_brain_disease.pth",
            "default_backbone": "efficientnet_b0",
            "default_image_size": 224,
            "disease_classes": [
                "Glioma",
                "Meningioma",
                "Pituitary",
                "No Tumor",
            ],
        },
    }
    
    def __init__(
        self,
        model_path: str = "backend/models/weights/efficientnet_skin_disease.pth",
        confidence_threshold: float = 0.6
    ):
        """
        Initialize the image diagnosis service
        
        Args:
            model_path: Backward-compatible default skin model path
            confidence_threshold: Minimum confidence for predictions (0-1)
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        self.model_metadata = {}
        self.modality_classes = {
            modality: list(config["disease_classes"])
            for modality, config in self.MODALITY_CONFIG.items()
        }
        self.modality_model_paths = {
            modality: config["model_path"]
            for modality, config in self.MODALITY_CONFIG.items()
        }
        self.modality_backbones = {
            modality: config.get("default_backbone", "efficientnet_b0")
            for modality, config in self.MODALITY_CONFIG.items()
        }
        self.modality_image_sizes = {
            modality: config.get("default_image_size", 224)
            for modality, config in self.MODALITY_CONFIG.items()
        }
        self.modality_model_paths["skin"] = model_path
        self.transforms = {
            modality: self._get_transform(self.modality_image_sizes.get(modality, 224))
            for modality in self.MODALITY_CONFIG
        }

        logger.info(f"🩺 Initializing Image Diagnosis Service")
        logger.info(f"   Device: {self.device}")
        logger.info(f"   Confidence threshold: {confidence_threshold}")

        for modality, path in self.modality_model_paths.items():
            if os.path.exists(path):
                try:
                    self._load_model(modality)
                except Exception as exc:
                    logger.warning(f"⚠️ Failed to load {modality} model from {path}: {exc}")
            else:
                logger.warning(f"⚠️ {modality.capitalize()} model weights not found at {path}")
    
    def _get_transform(self, image_size: int = 224) -> transforms.Compose:
        """
        Get image preprocessing transformations
        Uses ImageNet normalization (standard for EfficientNet)
        
        Returns:
            torchvision transforms composition
        """
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],  # ImageNet mean
                std=[0.229, 0.224, 0.225]     # ImageNet std
            )
        ])
    
    def _create_model(self, backbone: str, num_classes: int) -> nn.Module:
        """
        Create EfficientNet model architecture
        
        Returns:
            PyTorch model
        """
        model = timm.create_model(backbone, pretrained=False)
        
        # Modify classifier for our number of disease classes
        if hasattr(model, 'classifier') and isinstance(model.classifier, nn.Linear):
            in_features = model.classifier.in_features
            model.classifier = nn.Linear(in_features, num_classes)
        elif hasattr(model, 'get_classifier'):
            classifier = model.get_classifier()
            in_features = classifier.in_features
            model.classifier = nn.Linear(in_features, num_classes)
        else:
            raise RuntimeError(f"Unsupported backbone head for {backbone}")

        return model

    @staticmethod
    def _extract_state_dict(checkpoint):
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                return checkpoint['model_state_dict'], checkpoint
            if 'state_dict' in checkpoint:
                return checkpoint['state_dict'], checkpoint
        return checkpoint, checkpoint if isinstance(checkpoint, dict) else {}

    @staticmethod
    def _clean_state_dict(state_dict):
        if not isinstance(state_dict, dict):
            return state_dict

        cleaned_state_dict = {}
        for key, value in state_dict.items():
            if key.startswith('module.'):
                cleaned_state_dict[key[len('module.'):]] = value
            else:
                cleaned_state_dict[key] = value
        return cleaned_state_dict

    def _load_model(self, modality: str):
        """Load modality model weights from .pth file"""
        model_path = self.modality_model_paths[modality]
        try:
            logger.info(f"📥 Loading {modality} model weights from {model_path}")

            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
            state_dict, metadata = self._extract_state_dict(checkpoint)
            state_dict = self._clean_state_dict(state_dict)

            class_names = metadata.get('disease_classes') or metadata.get('class_names')
            if class_names:
                self.modality_classes[modality] = list(class_names)

            backbone = (
                metadata.get('backbone')
                or metadata.get('model_name')
                or self.modality_backbones.get(modality, 'efficientnet_b0')
            )
            image_size = int(metadata.get('image_size') or self.modality_image_sizes.get(modality, 224))
            self.modality_backbones[modality] = backbone
            self.modality_image_sizes[modality] = image_size
            self.transforms[modality] = self._get_transform(image_size)
            self.model_metadata[modality] = metadata

            model = self._create_model(backbone, num_classes=len(self.modality_classes[modality]))
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()

            self.models[modality] = model

            logger.info(f"✅ {modality.capitalize()} model loaded successfully")
            logger.info(f"   Backbone: {backbone}")
            logger.info(f"   Image size: {image_size}")
            logger.info(f"   Classes: {len(self.modality_classes[modality])}")
            logger.info(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")

        except Exception as e:
            logger.error(f"❌ Failed to load {modality} model: {e}")
            raise
    
    def preprocess_image(self, image_data: bytes, modality: str = "skin") -> torch.Tensor:
        """
        Preprocess image for model input
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Preprocessed tensor (1, 3, 224, 224)
        """
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB (handle RGBA, grayscale, etc.)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Apply transformations
            transform = self.transforms.get(modality, self.transforms["skin"])
            tensor = transform(image)
            
            # Add batch dimension
            tensor = tensor.unsqueeze(0)
            
            return tensor
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise ValueError(f"Invalid image data: {e}")
    
    def _ensure_model_loaded(self, modality: str):
        if modality in self.models:
            return

        model_path = self.modality_model_paths.get(modality)
        if not model_path or not os.path.exists(model_path):
            raise RuntimeError(
                f"Model for modality '{modality}' is not loaded. "
                f"Expected weights at: {model_path}"
            )

        self._load_model(modality)

    def predict(self, image_data: bytes, modality: str = "skin") -> Dict:
        """
        Predict disease from image
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Dictionary with prediction results:
            {
                'disease': str,
                'confidence': float,
                'all_predictions': List[Dict],
                'meets_threshold': bool
            }
        """
        modality = (modality or "skin").lower().strip()
        if modality not in self.MODALITY_CONFIG:
            raise ValueError(
                f"Unsupported modality '{modality}'. "
                f"Supported: {list(self.MODALITY_CONFIG.keys())}"
            )

        self._ensure_model_loaded(modality)
        model = self.models[modality]
        class_names = self.modality_classes[modality]
        
        try:
            # Preprocess image
            tensor = self.preprocess_image(image_data, modality=modality)
            tensor = tensor.to(self.device)

            # Run inference
            with torch.no_grad():
                logits = model(tensor)
                probabilities = torch.nn.functional.softmax(logits, dim=1)
                probs = probabilities[0].cpu().numpy()

            # Get top prediction
            top_idx = probs.argmax()
            top_disease = class_names[top_idx]
            top_confidence = float(probs[top_idx])

            # Get all predictions sorted by confidence
            all_predictions = [
                {
                    'disease': class_names[i],
                    'confidence': float(probs[i])
                }
                for i in range(len(class_names))
            ]
            all_predictions.sort(key=lambda x: x['confidence'], reverse=True)

            # Check if meets confidence threshold
            meets_threshold = top_confidence >= self.confidence_threshold

            result = {
                'modality': modality,
                'disease': top_disease,
                'confidence': top_confidence,
                'all_predictions': all_predictions,
                'meets_threshold': meets_threshold
            }

            logger.info(
                f"🔍 Prediction ({modality}): {top_disease} ({top_confidence:.2%})"
            )

            return result

        except Exception as e:
            logger.error(f"Error during prediction: {e}")
            raise

    def predict_from_file(self, file_path: str, modality: str = "skin") -> Dict:
        """
        Predict disease from image file path
        
        Args:
            file_path: Path to image file
            
        Returns:
            Prediction dictionary (same as predict())
        """
        with open(file_path, 'rb') as f:
            image_data = f.read()
        return self.predict(image_data, modality=modality)

    def get_model_info(self, modality: Optional[str] = None) -> Dict:
        """
        Get information about the loaded model
        
        Returns:
            Dictionary with model metadata
        """
        def _single_modality_info(modality_name: str) -> Dict:
            backbone = self.modality_backbones.get(modality_name, 'efficientnet_b0')
            return {
                'model_name': backbone.replace('_', '-').upper(),
                'backbone': backbone,
                'modality': modality_name,
                'num_classes': len(self.modality_classes[modality_name]),
                'disease_classes': self.modality_classes[modality_name],
                'input_size': (self.modality_image_sizes.get(modality_name, 224), self.modality_image_sizes.get(modality_name, 224)),
                'confidence_threshold': self.confidence_threshold,
                'device': str(self.device),
                'model_loaded': modality_name in self.models,
                'model_path': self.modality_model_paths[modality_name]
            }

        if modality:
            normalized_modality = modality.lower().strip()
            if normalized_modality not in self.MODALITY_CONFIG:
                raise ValueError(
                    f"Unsupported modality '{modality}'. "
                    f"Supported: {list(self.MODALITY_CONFIG.keys())}"
                )
            return _single_modality_info(normalized_modality)

        return {
            'model_name': 'EfficientNet Multi-Modal',
            'supported_modalities': list(self.MODALITY_CONFIG.keys()),
            'input_size': {
                modality_name: (self.modality_image_sizes.get(modality_name, 224), self.modality_image_sizes.get(modality_name, 224))
                for modality_name in self.MODALITY_CONFIG
            },
            'backbones': self.modality_backbones,
            'confidence_threshold': self.confidence_threshold,
            'device': str(self.device),
            'modalities': {
                modality_name: _single_modality_info(modality_name)
                for modality_name in self.MODALITY_CONFIG
            }
        }


# Singleton instance
_diagnosis_service_instance = None

def get_diagnosis_service() -> ImageDiagnosisService:
    """Get or create singleton diagnosis service instance"""
    global _diagnosis_service_instance
    if _diagnosis_service_instance is None:
        _diagnosis_service_instance = ImageDiagnosisService()
    return _diagnosis_service_instance

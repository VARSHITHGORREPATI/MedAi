#!/usr/bin/env python3
"""
Simple model setup for MedAI - Creates lightweight functional models.

This script creates EfficientNet-B0 models with ImageNet pretrained weights
and adds custom classifiers for MedMNIST tasks. While not fully trained on
medical data, these models provide a functional baseline.

For production use, you should train on actual MedMNIST data using
download_medmnist_models.py --method train

Usage:
    python backend/scripts/setup_models_simple.py
"""

import os
import sys
import torch
import timm
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.medmnist_labels import (
    CHEST_DISPLAY_CLASSES,
    DERMA_DISPLAY_CLASSES,
    OCT_DISPLAY_CLASSES,
    ORGAN_S_DISPLAY_CLASSES,
)


def create_baseline_model(modality: str, num_classes: int, class_names: list, 
                          is_multi_label: bool, dataset: str):
    """Create a baseline model with ImageNet pretrained weights."""
    
    print(f"Creating {modality} model...")
    print(f"  - Classes: {num_classes}")
    print(f"  - Multi-label: {is_multi_label}")
    
    # Create EfficientNet-B0 with ImageNet weights
    model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=num_classes)
    
    # Prepare checkpoint
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'num_classes': num_classes,
        'class_names': class_names,
        'multi_label': is_multi_label,
        'backbone': 'efficientnet_b0',
        'image_size': 224,
        'dataset': dataset,
        'note': 'ImageNet pretrained + custom classifier (not trained on medical data)',
    }
    
    # Save
    output_dir = Path("backend/models/weights")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"efficientnet_{modality}_disease.pth"
    
    torch.save(checkpoint, output_path)
    print(f"✅ Saved to {output_path}")
    return True


def main():
    print("=" * 70)
    print("MedAI - Simple Model Setup")
    print("=" * 70)
    print("\nThis creates baseline models with ImageNet pretrained weights.")
    print("For better accuracy, train on MedMNIST data using:")
    print("  python backend/scripts/download_medmnist_models.py --method train\n")
    
    models = [
        {
            "modality": "skin",
            "num_classes": len(DERMA_DISPLAY_CLASSES),
            "class_names": list(DERMA_DISPLAY_CLASSES),
            "is_multi_label": False,
            "dataset": "MedMNIST-DermaMNIST",
        },
        {
            "modality": "chest",
            "num_classes": len(CHEST_DISPLAY_CLASSES),
            "class_names": list(CHEST_DISPLAY_CLASSES),
            "is_multi_label": True,
            "dataset": "MedMNIST-ChestMNIST",
        },
        {
            "modality": "eye",
            "num_classes": len(OCT_DISPLAY_CLASSES),
            "class_names": list(OCT_DISPLAY_CLASSES),
            "is_multi_label": False,
            "dataset": "MedMNIST-OCTMNIST",
        },
        {
            "modality": "brain",
            "num_classes": len(ORGAN_S_DISPLAY_CLASSES),
            "class_names": list(ORGAN_S_DISPLAY_CLASSES),
            "is_multi_label": False,
            "dataset": "MedMNIST-OrganSMNIST",
        },
    ]
    
    success = 0
    for model_config in models:
        try:
            if create_baseline_model(**model_config):
                success += 1
            print()
        except Exception as e:
            print(f"❌ Failed: {e}\n")
    
    print("=" * 70)
    print(f"✅ Created {success}/{len(models)} models")
    print("=" * 70)
    
    if success > 0:
        print("\n🎉 Models ready! Restart your backend:")
        print("   cd backend && python main.py")
        print("\n⚠️  Note: These are baseline models. For production, train on medical data.")


if __name__ == "__main__":
    main()

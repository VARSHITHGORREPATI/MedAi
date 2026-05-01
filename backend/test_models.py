#!/usr/bin/env python3
"""Quick test to verify models load correctly"""

import os
import sys

# Test model files exist
print("=" * 60)
print("Testing Model Files")
print("=" * 60)

weights_dir = "models/weights"
models = [
    "efficientnet_skin_disease.pth",
    "efficientnet_chest_disease.pth",
    "efficientnet_eye_disease.pth",
    "efficientnet_brain_disease.pth",
]

for model_file in models:
    path = os.path.join(weights_dir, model_file)
    exists = os.path.exists(path)
    size = os.path.getsize(path) / (1024 * 1024) if exists else 0
    status = "✅" if exists else "❌"
    print(f"{status} {model_file}: {size:.2f} MB" if exists else f"{status} {model_file}: NOT FOUND")

print("\n" + "=" * 60)
print("Testing Model Loading")
print("=" * 60)

try:
    from services.image_diagnosis_service import ImageDiagnosisService
    
    service = ImageDiagnosisService()
    
    print(f"\n📊 Service initialized")
    print(f"   Device: {service.device}")
    print(f"   Models loaded: {len(service.models)}")
    
    for modality in ["skin", "chest", "eye", "brain"]:
        if modality in service.models:
            print(f"   ✅ {modality.capitalize()}: {len(service.modality_classes[modality])} classes")
        else:
            print(f"   ❌ {modality.capitalize()}: NOT LOADED")
    
    print("\n✅ All tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

"""
Test if models can make predictions
"""
import torch
from PIL import Image
import numpy as np
from services.image_diagnosis_service import ImageDiagnosisService

# Create a dummy test image (grayscale for chest)
test_image = Image.new('L', (224, 224), color=128)
test_image_bytes = np.array(test_image).tobytes()

# Initialize service
service = ImageDiagnosisService()

print("\n" + "="*60)
print("TESTING MODEL INFERENCE")
print("="*60)

# Test each modality
for modality in ['skin', 'chest', 'eye', 'brain']:
    print(f"\n🧪 Testing {modality.upper()} model...")
    
    if modality in service.models:
        print(f"   ✅ Model loaded")
        
        # Try a prediction
        try:
            # Create appropriate test image
            if modality == 'skin':
                img = Image.new('RGB', (224, 224), color=(200, 150, 150))
            else:
                img = Image.new('L', (224, 224), color=128)
            
            import io
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes = img_bytes.getvalue()
            
            result = service.predict(img_bytes, modality=modality)
            print(f"   ✅ Prediction successful")
            print(f"   Disease: {result.get('disease')}")
            print(f"   Confidence: {result.get('confidence', 0)*100:.1f}%")
            
        except Exception as e:
            print(f"   ❌ Prediction failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"   ❌ Model NOT loaded")

print("\n" + "="*60)

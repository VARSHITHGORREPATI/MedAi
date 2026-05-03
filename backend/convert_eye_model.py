import torch
import zipfile
import os

# Use the original zip file
zip_path = "../DATASETS/efficientnet_eye_disease.pth.zip"
output_path = "models/weights/efficientnet_eye_disease.pth"

print("📥 Loading eye model from zip file...")
try:
    # Extract to temp location
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
        
        # Find the model folder
        model_folder = os.path.join(tmpdir, "efficientnet_eye_disease")
        
        # Load using torch
        checkpoint = torch.load(model_folder, map_location="cpu", weights_only=False)
        
        print(f"✅ Model loaded successfully!")
        print(f"   Accuracy: {checkpoint.get('best_val_acc', 'N/A')}")
        print(f"   Classes: {checkpoint.get('num_classes', 'N/A')}")
        
        # Save as regular .pth file
        print(f"\n💾 Saving to {output_path}...")
        torch.save(checkpoint, output_path)
        
        print(f"✅ Eye model saved successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

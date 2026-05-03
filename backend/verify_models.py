import torch
import os

models = ['skin', 'chest', 'brain', 'eye']

print("\n" + "="*60)
print("MODEL VERIFICATION")
print("="*60)

for modality in models:
    try:
        # Check for both .pth and .pth.zip
        model_path = f"models/weights/efficientnet_{modality}_disease.pth"
        zip_path = model_path + ".zip"
        
        if os.path.exists(zip_path):
            print(f"\n✅ {modality.upper()} Model (ZIP):")
            checkpoint = torch.load(zip_path, map_location="cpu", weights_only=False)
        elif os.path.exists(model_path):
            print(f"\n✅ {modality.upper()} Model:")
            checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
        else:
            print(f"\n❌ {modality.upper()} Model: NOT FOUND")
            continue
        
        print(f"   Accuracy: {checkpoint['best_val_acc']:.2f}%")
        print(f"   Classes: {checkpoint['num_classes']}")
        print(f"   Multi-label: {checkpoint['multi_label']}")
        print(f"   Backbone: {checkpoint['backbone']}")
        
    except Exception as e:
        print(f"\n❌ {modality.upper()} Model: FAILED - {e}")

print("\n" + "="*60)
print("VERIFICATION COMPLETE")
print("="*60)

"""
Train all remaining medical image models sequentially
Trains chest, eye, and brain models with 20 epochs each
"""

import subprocess
import sys
import os
from pathlib import Path

def check_model_exists(modality: str) -> bool:
    """Check if model file already exists"""
    model_path = Path(f"models/weights/efficientnet_{modality}_disease.pth")
    return model_path.exists()

def train_model(modality: str, epochs: int = 20):
    """Train a single model"""
    print(f"\n{'='*60}")
    print(f"🚀 Starting {modality.upper()} model training ({epochs} epochs)")
    print(f"{'='*60}\n")
    
    cmd = [
        sys.executable,
        "scripts/download_medmnist_models.py",
        "--modality", modality,
        "--method", "train",
        "--epochs", str(epochs)
    ]
    
    try:
        result = subprocess.run(cmd, check=True, cwd=os.getcwd())
        print(f"\n✅ {modality.upper()} model training completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {modality.upper()} model training failed with error code {e.returncode}")
        return False
    except KeyboardInterrupt:
        print(f"\n⚠️ Training interrupted by user")
        return False

def main():
    """Train all remaining models"""
    print("="*60)
    print("MedAI - Sequential Model Training")
    print("="*60)
    print("\nThis will train the remaining medical image models:")
    print("  1. Chest (ChestMNIST) - 14 classes, multi-label")
    print("  2. Eye (OCTMNIST) - 4 classes")
    print("  3. Brain (OrganSMNIST) - 11 classes")
    print("\nEach model will be trained for 20 epochs.")
    print("Estimated time: 6-8 hours on CPU, 2-3 hours on GPU")
    print("="*60)
    
    # Check which models need training
    models_to_train = []
    for modality in ["chest", "eye", "brain"]:
        if check_model_exists(modality):
            print(f"✅ {modality.upper()} model already exists, skipping...")
        else:
            models_to_train.append(modality)
    
    if not models_to_train:
        print("\n🎉 All models already trained!")
        return
    
    print(f"\n📋 Models to train: {', '.join(m.upper() for m in models_to_train)}")
    print("\nStarting training in 5 seconds... (Press Ctrl+C to cancel)")
    
    try:
        import time
        time.sleep(5)
    except KeyboardInterrupt:
        print("\n⚠️ Training cancelled by user")
        return
    
    # Train each model
    results = {}
    for i, modality in enumerate(models_to_train, 1):
        print(f"\n\n{'#'*60}")
        print(f"# Training Model {i}/{len(models_to_train)}: {modality.upper()}")
        print(f"{'#'*60}\n")
        
        success = train_model(modality, epochs=20)
        results[modality] = success
        
        if not success:
            print(f"\n⚠️ Stopping training due to failure in {modality} model")
            break
    
    # Print summary
    print("\n\n" + "="*60)
    print("TRAINING SUMMARY")
    print("="*60)
    
    for modality, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{modality.upper():10s} : {status}")
    
    successful = sum(1 for s in results.values() if s)
    print(f"\nCompleted: {successful}/{len(results)} models")
    
    if successful == len(results):
        print("\n🎉 All models trained successfully!")
        print("\n📝 Next steps:")
        print("   1. Restart your backend server:")
        print("      cd backend && python main.py")
        print("   2. Test the models with medical images")
    else:
        print("\n⚠️ Some models failed to train. Check the logs above for details.")
    
    print("="*60)

if __name__ == "__main__":
    main()

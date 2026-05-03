"""
MedAI Model Training Script for Google Colab
Train all medical image models with GPU acceleration

Instructions:
1. Go to https://colab.research.google.com/
2. Upload this file
3. Runtime → Change runtime type → GPU (T4)
4. Run this cell
5. Download the trained_models.zip file
6. Extract to backend/models/weights/
"""

# Install dependencies
print("📦 Installing dependencies...")
import subprocess
subprocess.run(["pip", "install", "torch", "torchvision", "medmnist", "timm", "tqdm", "-q"], check=True)

# Import libraries
import os
import torch
import torch.nn as nn
import timm
import medmnist
from medmnist import INFO
from torch.utils.data import DataLoader
from torchvision import transforms
from tqdm import tqdm

# Verify GPU
print(f"\n🖥️  CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"   GPU: {torch.cuda.get_device_name(0)}")
else:
    print("   ⚠️ No GPU! Go to Runtime → Change runtime type → GPU")

# Disease class definitions
CHEST_DISPLAY_CLASSES = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
    "Mass", "Nodule", "Pneumonia", "Pneumothorax",
    "Consolidation", "Edema", "Emphysema", "Fibrosis",
    "Pleural Thickening", "Hernia"
]

DERMA_DISPLAY_CLASSES = [
    "Actinic keratoses and intraepithelial carcinoma",
    "Basal cell carcinoma",
    "Benign keratosis-like lesions",
    "Dermatofibroma",
    "Melanoma",
    "Melanocytic nevi",
    "Vascular lesions"
]

OCT_DISPLAY_CLASSES = [
    "Choroidal neovascularization",
    "Diabetic macular edema",
    "Drusen",
    "Normal"
]

ORGAN_S_DISPLAY_CLASSES = [
    "Bladder", "Femur left", "Femur right", "Heart",
    "Kidney left", "Kidney right", "Liver",
    "Lung left", "Lung right", "Pancreas", "Spleen"
]

MODALITY_CONFIG = {
    "skin": {
        "dataset": "dermamnist",
        "num_classes": len(DERMA_DISPLAY_CLASSES),
        "task": "multi-class",
        "class_names": DERMA_DISPLAY_CLASSES,
    },
    "chest": {
        "dataset": "chestmnist",
        "num_classes": len(CHEST_DISPLAY_CLASSES),
        "task": "multi-label",
        "class_names": CHEST_DISPLAY_CLASSES,
    },
    "eye": {
        "dataset": "octmnist",
        "num_classes": len(OCT_DISPLAY_CLASSES),
        "task": "multi-class",
        "class_names": OCT_DISPLAY_CLASSES,
    },
    "brain": {
        "dataset": "organsmnist",
        "num_classes": len(ORGAN_S_DISPLAY_CLASSES),
        "task": "multi-class",
        "class_names": ORGAN_S_DISPLAY_CLASSES,
    },
}

def train_model(modality, epochs=5):
    """Train a single model"""
    config = MODALITY_CONFIG[modality]
    dataset_name = config["dataset"]
    num_classes = config["num_classes"]
    is_multi_label = config["task"] == "multi-label"
    
    print(f"\n{'='*60}")
    print(f"🚀 Training {modality.upper()} model")
    print(f"   Dataset: {dataset_name}")
    print(f"   Classes: {num_classes}")
    print(f"   Multi-label: {is_multi_label}")
    print(f"   Epochs: {epochs}")
    print(f"{'='*60}\n")
    
    # Get dataset
    info = INFO[dataset_name]
    DataClass = getattr(medmnist, info['python_class'])
    
    # Transforms
    if modality == "skin":
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    else:
        # Grayscale datasets - convert to 3-channel
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Lambda(lambda x: x.repeat(3, 1, 1) if x.size(0) == 1 else x),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    # Load datasets
    print("📥 Downloading dataset...")
    train_dataset = DataClass(split='train', transform=transform, download=True)
    val_dataset = DataClass(split='val', transform=transform, download=True)
    
    train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=128, shuffle=False, num_workers=2)
    
    # Create model
    print("🏗️  Creating EfficientNet-B0 model...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=num_classes)
    model = model.to(device)
    
    # Loss and optimizer
    if is_multi_label:
        criterion = nn.BCEWithLogitsLoss()
    else:
        criterion = nn.CrossEntropyLoss()
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)
    
    # Training loop
    print(f"🎯 Training for {epochs} epochs...")
    best_acc = 0.0
    
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}")
        for images, labels in pbar:
            images, labels = images.to(device), labels.to(device)
            
            if is_multi_label:
                labels = labels.float()
            else:
                labels = labels.squeeze().long()
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
            if is_multi_label:
                preds = (torch.sigmoid(outputs) > 0.5).float()
                train_correct += (preds == labels).sum().item()
                train_total += labels.numel()
            else:
                _, preds = outputs.max(1)
                train_correct += preds.eq(labels).sum().item()
                train_total += labels.size(0)
            
            pbar.set_postfix({'loss': f'{loss.item():.4f}'})
        
        train_acc = 100. * train_correct / train_total
        
        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                
                if is_multi_label:
                    labels = labels.float()
                else:
                    labels = labels.squeeze().long()
                
                outputs = model(images)
                
                if is_multi_label:
                    preds = (torch.sigmoid(outputs) > 0.5).float()
                    val_correct += (preds == labels).sum().item()
                    val_total += labels.numel()
                else:
                    _, preds = outputs.max(1)
                    val_correct += preds.eq(labels).sum().item()
                    val_total += labels.size(0)
        
        val_acc = 100. * val_correct / val_total
        print(f"Epoch {epoch+1}: Train Acc: {train_acc:.2f}%, Val Acc: {val_acc:.2f}%")
        
        if val_acc > best_acc:
            best_acc = val_acc
    
    # Save model
    output_path = f"efficientnet_{modality}_disease.pth"
    print(f"\n💾 Saving model to {output_path}...")
    
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'num_classes': num_classes,
        'class_names': config["class_names"],
        'multi_label': is_multi_label,
        'backbone': 'efficientnet_b0',
        'image_size': 224,
        'dataset': f"MedMNIST-{dataset_name}",
        'task': config["task"],
        'best_val_acc': best_acc,
    }
    
    torch.save(checkpoint, output_path)
    print(f"✅ Model saved! Best validation accuracy: {best_acc:.2f}%")
    
    return output_path

# Train all models with 20 epochs for high accuracy
trained_models = []

print("\n" + "="*60)
print("Starting training for 4 models (skin, chest, eye, brain)")
print("Training with 20 epochs each for maximum accuracy")
print("="*60)

trained_models.append(train_model("skin", epochs=20))
trained_models.append(train_model("chest", epochs=20))
trained_models.append(train_model("eye", epochs=20))
trained_models.append(train_model("brain", epochs=20))

print("\n" + "="*60)
print("🎉 All models trained successfully!")
print("="*60)
print("\nTrained models:")
for model_path in trained_models:
    print(f"  ✅ {model_path}")

# Package and download
print("\n📦 Creating zip file...")
subprocess.run(["zip", "-r", "trained_models.zip"] + [f"efficientnet_{m}_disease.pth" for m in ["skin", "chest", "eye", "brain"]], check=True)

print("\n✅ Models packaged as trained_models.zip")
print("\n⬇️ Downloading file...")

# Download in Colab
try:
    from google.colab import files
    files.download('trained_models.zip')
    print("\n✅ Download started! Check your browser downloads.")
except:
    print("\n⚠️ Not running in Colab. File saved as trained_models.zip")

print("\n📝 Next steps:")
print("   1. Extract trained_models.zip")
print("   2. Copy .pth files to: backend/models/weights/")
print("   3. Restart your backend server")

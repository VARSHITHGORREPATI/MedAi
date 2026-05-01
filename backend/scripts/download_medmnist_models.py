#!/usr/bin/env python3
"""
Download pretrained MedMNIST models for the MedAI project.

This script downloads pretrained EfficientNet-B0 models trained on MedMNIST datasets.
Since official pretrained weights may not be available, this script provides options:

1. Download from Hugging Face Hub (if available)
2. Train lightweight models using MedMNIST library
3. Use transfer learning with minimal training

Usage:
    python backend/scripts/download_medmnist_models.py --modality all
    python backend/scripts/download_medmnist_models.py --modality skin
"""

import os
import sys
import argparse
import torch
import torch.nn as nn
import timm
from pathlib import Path
import logging

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.medmnist_labels import (
    CHEST_DISPLAY_CLASSES,
    DERMA_DISPLAY_CLASSES,
    OCT_DISPLAY_CLASSES,
    ORGAN_S_DISPLAY_CLASSES,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


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


def create_efficientnet_model(num_classes: int, multi_label: bool = False):
    """Create EfficientNet-B0 model with custom classifier."""
    model = timm.create_model('efficientnet_b0', pretrained=True, num_classes=num_classes)
    return model


def try_download_from_huggingface(modality: str, output_path: Path) -> bool:
    """
    Try to download pretrained model from Hugging Face Hub.
    Returns True if successful, False otherwise.
    """
    try:
        from huggingface_hub import hf_hub_download
        
        # Try common repository patterns
        repo_patterns = [
            f"medmnist/{modality}-efficientnet",
            f"medmnist/efficientnet-{modality}",
            f"medical-ai/medmnist-{modality}",
        ]
        
        for repo_id in repo_patterns:
            try:
                logger.info(f"Trying to download from {repo_id}...")
                file_path = hf_hub_download(
                    repo_id=repo_id,
                    filename="pytorch_model.bin",
                    cache_dir=".cache"
                )
                
                # Copy to our weights directory
                import shutil
                shutil.copy(file_path, output_path)
                logger.info(f"✅ Downloaded from {repo_id}")
                return True
            except Exception as e:
                logger.debug(f"Failed to download from {repo_id}: {e}")
                continue
        
        return False
    except ImportError:
        logger.warning("huggingface_hub not installed. Install with: pip install huggingface_hub")
        return False


def quick_train_model(modality: str, output_path: Path, epochs: int = 3):
    """
    Quick training on MedMNIST dataset.
    This creates a functional model with reasonable accuracy.
    """
    try:
        import medmnist
        from medmnist import INFO
        from torch.utils.data import DataLoader
        from torchvision import transforms
        from tqdm import tqdm
        
        config = MODALITY_CONFIG[modality]
        dataset_name = config["dataset"]
        num_classes = config["num_classes"]
        is_multi_label = config["task"] == "multi-label"
        
        logger.info(f"🚀 Quick training {modality} model on {dataset_name}...")
        logger.info(f"   Classes: {num_classes}, Multi-label: {is_multi_label}")
        
        # Get dataset info
        info = INFO[dataset_name]
        DataClass = getattr(medmnist, info['python_class'])
        
        # Transforms
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Load datasets
        logger.info("📥 Downloading MedMNIST dataset...")
        train_dataset = DataClass(split='train', transform=transform, download=True)
        val_dataset = DataClass(split='val', transform=transform, download=True)
        
        train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True, num_workers=2)
        val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False, num_workers=2)
        
        # Create model
        logger.info("🏗️  Creating EfficientNet-B0 model...")
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = create_efficientnet_model(num_classes, is_multi_label)
        model = model.to(device)
        
        # Loss and optimizer
        if is_multi_label:
            criterion = nn.BCEWithLogitsLoss()
        else:
            criterion = nn.CrossEntropyLoss()
        
        optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4)
        
        # Training loop
        logger.info(f"🎯 Training for {epochs} epochs...")
        best_acc = 0.0
        
        for epoch in range(epochs):
            model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0
            
            pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}")
            for images, labels in pbar:
                images, labels = images.to(device), labels.to(device)
                
                # Handle label shape
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
                
                # Calculate accuracy
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
            logger.info(f"Epoch {epoch+1}: Train Acc: {train_acc:.2f}%, Val Acc: {val_acc:.2f}%")
            
            if val_acc > best_acc:
                best_acc = val_acc
        
        # Save model
        logger.info(f"💾 Saving model to {output_path}...")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
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
        logger.info(f"✅ Model saved! Best validation accuracy: {best_acc:.2f}%")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to train model: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_dummy_model(modality: str, output_path: Path):
    """
    Create a dummy model with random weights as a fallback.
    This allows the system to run but won't give accurate predictions.
    """
    logger.warning(f"⚠️  Creating dummy model for {modality} (random weights)")
    
    config = MODALITY_CONFIG[modality]
    num_classes = config["num_classes"]
    is_multi_label = config["task"] == "multi-label"
    
    model = create_efficientnet_model(num_classes, is_multi_label)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'num_classes': num_classes,
        'class_names': config["class_names"],
        'multi_label': is_multi_label,
        'backbone': 'efficientnet_b0',
        'image_size': 224,
        'dataset': f"MedMNIST-{config['dataset']}",
        'task': config["task"],
        'note': 'DUMMY MODEL - Random weights, not trained',
    }
    
    torch.save(checkpoint, output_path)
    logger.info(f"✅ Dummy model created at {output_path}")


def download_model(modality: str, method: str = "auto", epochs: int = 3):
    """
    Download or create model for specified modality.
    
    Args:
        modality: One of 'skin', 'chest', 'eye', 'brain'
        method: 'auto', 'huggingface', 'train', or 'dummy'
        epochs: Number of epochs for training (if method='train')
    """
    if modality not in MODALITY_CONFIG:
        logger.error(f"❌ Unknown modality: {modality}")
        return False
    
    output_path = Path(f"backend/models/weights/efficientnet_{modality}_disease.pth")
    
    if output_path.exists():
        logger.info(f"ℹ️  Model already exists at {output_path}")
        response = input("Overwrite? (y/n): ")
        if response.lower() != 'y':
            return True
    
    logger.info(f"📦 Processing {modality} model...")
    
    if method == "auto":
        # Try methods in order
        if try_download_from_huggingface(modality, output_path):
            return True
        
        logger.info("Hugging Face download failed, trying quick training...")
        if quick_train_model(modality, output_path, epochs):
            return True
        
        logger.warning("Training failed, creating dummy model...")
        create_dummy_model(modality, output_path)
        return True
    
    elif method == "huggingface":
        return try_download_from_huggingface(modality, output_path)
    
    elif method == "train":
        return quick_train_model(modality, output_path, epochs)
    
    elif method == "dummy":
        create_dummy_model(modality, output_path)
        return True
    
    else:
        logger.error(f"❌ Unknown method: {method}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Download MedMNIST pretrained models")
    parser.add_argument(
        "--modality",
        type=str,
        default="all",
        choices=["all", "skin", "chest", "eye", "brain"],
        help="Which modality to download (default: all)"
    )
    parser.add_argument(
        "--method",
        type=str,
        default="auto",
        choices=["auto", "huggingface", "train", "dummy"],
        help="Download method (default: auto)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs if using 'train' method (default: 3)"
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("MedMNIST Model Downloader for MedAI")
    logger.info("=" * 60)
    
    modalities = list(MODALITY_CONFIG.keys()) if args.modality == "all" else [args.modality]
    
    success_count = 0
    for modality in modalities:
        if download_model(modality, args.method, args.epochs):
            success_count += 1
        logger.info("-" * 60)
    
    logger.info("=" * 60)
    logger.info(f"✅ Successfully processed {success_count}/{len(modalities)} models")
    logger.info("=" * 60)
    
    if success_count > 0:
        logger.info("\n🎉 Models are ready! Restart your backend server to use them.")
        logger.info("   cd backend && python main.py")


if __name__ == "__main__":
    main()

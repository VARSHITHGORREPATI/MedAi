#!/bin/bash
# Quick setup script for MedAI models

echo "=========================================="
echo "MedAI Model Setup"
echo "=========================================="
echo ""
echo "Choose setup method:"
echo "1) Quick baseline models (5 min, ImageNet pretrained)"
echo "2) Train on MedMNIST data (30-60 min, better accuracy)"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "Creating baseline models..."
        cd backend
        python scripts/setup_models_simple.py
        ;;
    2)
        echo ""
        echo "Installing MedMNIST..."
        pip install medmnist tqdm
        echo ""
        echo "Training models (this will take 30-60 minutes)..."
        cd backend
        python scripts/download_medmnist_models.py --modality all --method train --epochs 3
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart your backend server:"
echo "   cd backend && python main.py"
echo ""
echo "2. Test image upload in the frontend"
echo ""

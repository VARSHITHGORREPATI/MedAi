#!/bin/bash
# Quick Setup Script for MedAI Image Diagnosis
# Run this to get started quickly

echo "=================================================="
echo "MedAI - EfficientNet Image Diagnosis Setup"
echo "=================================================="
echo ""

# Check if in backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this from the backend/ directory"
    echo "   cd backend"
    echo "   bash setup_diagnosis.sh"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
pip install timm>=0.9.12 --quiet

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Warning: pip install had issues (may already be installed)"
fi

echo ""
echo "🔧 Step 2: Creating demo model..."
python create_demo_model.py create

echo ""
echo "✅ Setup Complete!"
echo ""
echo "=================================================="
echo "Next Steps:"
echo "=================================================="
echo ""
echo "1. Start the server:"
echo "   python main.py"
echo ""
echo "2. Test the API:"
echo "   - Open: http://localhost:8000/docs"
echo "   - Find: POST /api/diagnose"
echo "   - Upload a skin image and test"
echo ""
echo "3. Or use the test script:"
echo "   python test_diagnosis_api.py your-email@example.com password"
echo ""
echo "4. Replace demo model with your trained model:"
echo "   cp your_model.pth models/weights/efficientnet_skin_disease.pth"
echo "   python create_demo_model.py verify"
echo ""
echo "📚 Documentation:"
echo "   - DIAGNOSIS_README.md - Complete guide"
echo "   - IMPLEMENTATION_SUMMARY.md - Overview"
echo ""
echo "⚠️  Remember: Demo model has RANDOM weights!"
echo "   Replace with trained model for real predictions."
echo ""
echo "=================================================="

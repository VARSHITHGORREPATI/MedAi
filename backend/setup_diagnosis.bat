@echo off
REM Quick Setup Script for MedAI Image Diagnosis (Windows)
REM Run this to get started quickly

echo ==================================================
echo MedAI - EfficientNet Image Diagnosis Setup
echo ==================================================
echo.

REM Check if in backend directory
if not exist "requirements.txt" (
    echo ❌ Error: Please run this from the backend\ directory
    echo    cd backend
    echo    setup_diagnosis.bat
    exit /b 1
)

echo 📦 Step 1: Installing dependencies...
pip install timm>=0.9.12 --quiet

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed
) else (
    echo ⚠️  Warning: pip install had issues ^(may already be installed^)
)

echo.
echo 🔧 Step 2: Creating demo model...
python create_demo_model.py create

echo.
echo ✅ Setup Complete!
echo.
echo ==================================================
echo Next Steps:
echo ==================================================
echo.
echo 1. Start the server:
echo    python main.py
echo.
echo 2. Test the API:
echo    - Open: http://localhost:8000/docs
echo    - Find: POST /api/diagnose
echo    - Upload a skin image and test
echo.
echo 3. Or use the test script:
echo    python test_diagnosis_api.py your-email@example.com password
echo.
echo 4. Replace demo model with your trained model:
echo    copy your_model.pth models\weights\efficientnet_skin_disease.pth
echo    python create_demo_model.py verify
echo.
echo 📚 Documentation:
echo    - DIAGNOSIS_README.md - Complete guide
echo    - IMPLEMENTATION_SUMMARY.md - Overview
echo.
echo ⚠️  Remember: Demo model has RANDOM weights!
echo    Replace with trained model for real predictions.
echo.
echo ==================================================

pause

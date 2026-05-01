@echo off
REM Quick setup script for MedAI models (Windows)

echo ==========================================
echo MedAI Model Setup
echo ==========================================
echo.
echo Choose setup method:
echo 1) Quick baseline models (5 min, ImageNet pretrained)
echo 2) Train on MedMNIST data (30-60 min, better accuracy)
echo 3) Exit
echo.
set /p choice="Enter choice [1-3]: "

if "%choice%"=="1" goto baseline
if "%choice%"=="2" goto train
if "%choice%"=="3" goto end
echo Invalid choice
goto end

:baseline
echo.
echo Creating baseline models...
cd backend
python scripts\setup_models_simple.py
goto complete

:train
echo.
echo Installing MedMNIST...
pip install medmnist tqdm
echo.
echo Training models (this will take 30-60 minutes)...
cd backend
python scripts\download_medmnist_models.py --modality all --method train --epochs 3
goto complete

:complete
echo.
echo ==========================================
echo Setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Restart your backend server:
echo    cd backend ^&^& python main.py
echo.
echo 2. Test image upload in the frontend
echo.
goto end

:end
pause

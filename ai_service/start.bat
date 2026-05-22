@echo off
echo ====================================================
echo   AI Service - He thong nhan dien benh tom
echo ====================================================

:: Cai dat thu vien neu chua co
pip install -r requirements.txt --quiet

:: Chay service
set MODEL_PATH=..\model_ai\best_model_v3.pth
set AI_PORT=5001

echo.
echo [*] Dang khoi dong AI service tren cong %AI_PORT%...
python app.py

pause

@echo off
echo ========================================
echo   Starting Backend Service (FastAPI)
echo ========================================
echo.

cd /d D:\AB\backend

:: Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found!
    echo [INFO] Please create venv first: python -m venv .venv
    echo [INFO] Then install dependencies: .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

echo [INFO] Starting backend API server...
echo [INFO] API Docs: http://localhost:8001/docs
echo [INFO] Server: http://localhost:8001
echo.

.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

pause

@echo off
echo [1] Stopping old backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [2] Clearing Python cache...
for /d /r "D:\AB\backend\app" %%d in (__pycache__) do (
    if exist "%%d" rd /s /q "%%d"
)

echo [3] Starting backend on port 8001...
cd /d D:\AB\backend
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

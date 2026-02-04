@echo off
echo ========================================
echo   Statistical Analysis Platform v3.0
echo   Starting All Services
echo ========================================
echo.

:: [1] Kill old backend processes on port 8001
echo [1] Stopping old backend processes on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: [2] Clear Python cache
echo [2] Clearing Python cache...
for /d /r "D:\AB\backend\app" %%d in (__pycache__) do (
    if exist "%%d" rd /s /q "%%d"
)

:: [3] Start backend service (new window)
echo [3] Starting backend service...
start "Backend - FastAPI" cmd /k "cd /d D:\AB\backend && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

:: Wait for backend to initialize
timeout /t 3 /nobreak >nul

:: [4] Start frontend service (new window)
echo [4] Starting frontend service...
start "Frontend - React+Vite" cmd /k "cd /d D:\AB\frontend && npm run dev"

echo.
echo ========================================
echo [SUCCESS] Services started!
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8001/docs
echo.
echo   Close the command windows to stop services
echo ========================================
echo.
pause

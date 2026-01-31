@echo off
echo ========================================
echo   Hypothesis Testing Analysis Service
echo   Starting All Services
echo ========================================
echo.
echo [INFO] Starting frontend and backend services...
echo.
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:8001
echo   - API Docs: http://localhost:8001/docs
echo.
echo ========================================

:: Start backend service (new window)
echo [INFO] Starting backend service...
start "Backend - FastAPI" cmd /k "cd /d D:\AB\backend && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend service (new window)
echo [INFO] Starting frontend service...
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

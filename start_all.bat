@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: Get script directory
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

echo ========================================
echo   Statistical Analysis Platform v3.0
echo   Starting All Services
echo ========================================
echo.

:: ============================================================
:: [1] Clean up occupied ports
:: ============================================================
echo [1/6] Cleaning up occupied ports...

:: Kill processes on port 8001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":8001 " ^| findstr "LISTENING" 2^>nul') do (
    echo       Terminating PID %%a on port 8001...
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill processes on port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    echo       Terminating PID %%a on port 5173...
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul
echo       Done.
echo.

:: ============================================================
:: [2] Clear Python cache
:: ============================================================
echo [2/6] Clearing Python cache...
if exist "%BACKEND%\app" (
    for /d /r "%BACKEND%\app" %%d in (__pycache__) do (
        if exist "%%d" rd /s /q "%%d"
    )
)
echo       Done.
echo.

:: ============================================================
:: [3] Check backend dependencies
:: ============================================================
echo [3/6] Checking backend dependencies...
if not exist "%BACKEND%\.venv\Scripts\python.exe" (
    echo       Virtual environment not found, creating...
    pushd "%BACKEND%"
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        popd
        pause
        exit /b 1
    )
    echo       Installing Python dependencies...
    .venv\Scripts\pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies!
        popd
        pause
        exit /b 1
    )
    echo       Python dependencies installed.
    popd
) else (
    echo       Backend venv OK.
)
echo.

:: ============================================================
:: [4] Check frontend dependencies
:: ============================================================
echo [4/6] Checking frontend dependencies...
if not exist "%FRONTEND%\node_modules" (
    echo       node_modules not found, installing...
    pushd "%FRONTEND%"
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies!
        popd
        pause
        exit /b 1
    )
    echo       Frontend dependencies installed.
    popd
) else (
    echo       Frontend node_modules OK.
)
echo.

:: ============================================================
:: [5] Start services in new windows
:: ============================================================
echo [5/6] Starting services...

:: Start backend
echo       Starting backend (port 8001)...
start "Backend - FastAPI" cmd /k "chcp 65001 >nul 2>&1 && cd /d !BACKEND! && .venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

:: Start frontend
echo       Starting frontend (port 5173)...
start "Frontend - React+Vite" cmd /k "chcp 65001 >nul 2>&1 && cd /d !FRONTEND! && npm run dev"

echo       Services launched.
echo.

:: ============================================================
:: [6] Health check
:: ============================================================
echo [6/6] Waiting for backend to become ready...

set "HEALTH_OK=0"
for /l %%i in (1,1,15) do (
    if "!HEALTH_OK!"=="0" (
        timeout /t 2 /nobreak >nul
        powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8001/health' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
        if !errorlevel! equ 0 (
            set "HEALTH_OK=1"
        ) else (
            <nul set /p "=."
        )
    )
)

echo.
echo.

if "!HEALTH_OK!"=="1" (
    echo ========================================
    echo   [OK] All services started successfully!
    echo.
    echo   Frontend: http://localhost:5173
    echo   Backend:  http://localhost:8001
    echo   API Docs: http://localhost:8001/docs
    echo.
    echo   Run stop_all.bat to stop all services.
    echo ========================================
) else (
    echo ========================================
    echo   [WARN] Backend health check timed out.
    echo   The server may still be starting up.
    echo.
    echo   Frontend: http://localhost:5173
    echo   Backend:  http://localhost:8001
    echo   API Docs: http://localhost:8001/docs
    echo.
    echo   Check the backend window for errors.
    echo ========================================
)

echo.
pause

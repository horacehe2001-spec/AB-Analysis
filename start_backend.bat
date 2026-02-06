@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: Get script directory (works regardless of where the script is called from)
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "BACKEND=%ROOT%\backend"

echo ========================================
echo   Starting Backend Service (FastAPI)
echo ========================================
echo.

:: Check backend directory exists
if not exist "%BACKEND%" (
    echo [ERROR] Backend directory not found: %BACKEND%
    pause
    exit /b 1
)

cd /d "%BACKEND%"

:: Check port 8001 occupancy
set "PORT_IN_USE=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":8001 " ^| findstr "LISTENING" 2^>nul') do (
    set "PORT_IN_USE=1"
    set "OLD_PID=%%a"
)
if "!PORT_IN_USE!"=="1" (
    echo [WARN] Port 8001 is already in use (PID: !OLD_PID!^)
    set /p "KILL_CHOICE=[?] Terminate the process? (Y/N): "
    if /i "!KILL_CHOICE!"=="Y" (
        taskkill /PID !OLD_PID! /F >nul 2>&1
        echo [INFO] Process terminated.
        timeout /t 2 /nobreak >nul
    ) else (
        echo [INFO] Aborted. Please free port 8001 first.
        pause
        exit /b 1
    )
)

:: Check if virtual environment exists, create if missing
if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Virtual environment not found, creating...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment!
        echo [INFO] Make sure Python is installed and in PATH.
        pause
        exit /b 1
    )
    echo [INFO] Installing dependencies...
    .venv\Scripts\pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
)

echo.
echo [INFO] Starting backend API server...
echo [INFO] API Docs: http://localhost:8001/docs
echo [INFO] Server:   http://localhost:8001
echo.

.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

pause

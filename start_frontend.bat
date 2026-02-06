@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: Get script directory
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "FRONTEND=%ROOT%\frontend"

echo ========================================
echo   Starting Frontend Service (React+Vite)
echo ========================================
echo.

:: Check frontend directory exists
if not exist "%FRONTEND%" (
    echo [ERROR] Frontend directory not found: %FRONTEND%
    pause
    exit /b 1
)

cd /d "%FRONTEND%"

:: Check port 5173 occupancy
set "PORT_IN_USE=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    set "PORT_IN_USE=1"
    set "OLD_PID=%%a"
)
if "!PORT_IN_USE!"=="1" (
    echo [WARN] Port 5173 is already in use (PID: !OLD_PID!^)
    set /p "KILL_CHOICE=[?] Terminate the process? (Y/N): "
    if /i "!KILL_CHOICE!"=="Y" (
        taskkill /PID !OLD_PID! /F >nul 2>&1
        echo [INFO] Process terminated.
        timeout /t 2 /nobreak >nul
    ) else (
        echo [INFO] Aborted. Please free port 5173 first.
        pause
        exit /b 1
    )
)

:: Check if node_modules exists, install if missing
if not exist "node_modules" (
    echo [INFO] node_modules not found, installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
)

echo.
echo [INFO] Starting frontend dev server...
echo [INFO] URL: http://localhost:5173
echo.

call npm run dev

pause

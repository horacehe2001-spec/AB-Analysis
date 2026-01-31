@echo off
echo ========================================
echo   Starting Frontend Service (React+Vite)
echo ========================================
echo.

cd /d D:\AB\frontend

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] node_modules not found, installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo [INFO] Starting frontend dev server...
echo [INFO] URL: http://localhost:5173
echo.
call npm run dev

pause

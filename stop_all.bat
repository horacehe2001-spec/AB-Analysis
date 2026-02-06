@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ========================================
echo   Statistical Analysis Platform v3.0
echo   Stopping All Services
echo ========================================
echo.

set "KILLED=0"

:: Stop backend (port 8001)
echo [1/2] Stopping backend (port 8001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":8001 " ^| findstr "LISTENING" 2^>nul') do (
    echo       Terminating PID %%a...
    taskkill /PID %%a /F >nul 2>&1
    set "KILLED=1"
)
if "!KILLED!"=="0" (
    echo       No process found on port 8001.
) else (
    echo       Backend stopped.
)

echo.

:: Stop frontend (port 5173)
set "KILLED=0"
echo [2/2] Stopping frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    echo       Terminating PID %%a...
    taskkill /PID %%a /F >nul 2>&1
    set "KILLED=1"
)
if "!KILLED!"=="0" (
    echo       No process found on port 5173.
) else (
    echo       Frontend stopped.
)

echo.
echo ========================================
echo   [OK] All services stopped.
echo ========================================
echo.
pause

@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   DSQ SYSTEM - AUTO START WITH MONITOR
echo ========================================
echo.

REM Get current machine IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "MACHINE_IP=%%a"
    set "MACHINE_IP=!MACHINE_IP: =!"
    goto :ip_found
)
:ip_found
if not defined MACHINE_IP set "MACHINE_IP=localhost"

echo [1/2] Starting DSQ System...
start "DSQ System Launcher" cmd /c "%~dp0run_24_7.bat"

echo Waiting for system to initialize...
timeout /t 15 /nobreak >nul

echo [2/2] Starting Auto-Monitor...
start "DSQ Auto Monitor" cmd /c "%~dp0monitor_24_7.bat"

echo.
echo ========================================
echo DSQ System + Monitor Started!
echo ========================================
echo.
echo 🌐 System: http://%MACHINE_IP%:5173/
echo 📊 Three windows opened:
echo   - DSQ Backend 24/7
echo   - DSQ Frontend 24/7  
echo   - DSQ Auto Monitor
echo.
echo ⚠️  DO NOT close the monitor window!
echo    It will auto-restart crashed services.
echo.
echo To stop everything: stop_24_7.bat
echo.
pause

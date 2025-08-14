@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   DSQ SYSTEM - AUTO-RESTART 24/7
echo ========================================
echo.

REM Configuration
set "CHECK_INTERVAL=30"
set "MAX_RESTART_ATTEMPTS=5"
set "RESTART_DELAY=10"

echo This script will monitor and auto-restart DSQ services
echo Check interval: %CHECK_INTERVAL% seconds
echo Max restart attempts: %MAX_RESTART_ATTEMPTS%
echo.

set /p confirm="Start monitoring? (y/n): "
if /i not "%confirm%"=="y" goto :end

REM Find best Python
set "PYTHON_CMD=python"
py --version >nul 2>&1
if %errorlevel% equ 0 (
    py -m pip show uvicorn >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYTHON_CMD=py"
    )
)

echo Starting with Python command: %PYTHON_CMD%
echo.

:monitor_loop
set "backend_attempts=0"
set "frontend_attempts=0"

echo [%date% %time%] Starting monitoring loop...

:check_services
REM Check Backend
curl -s -m 5 http://localhost:8000/docs >nul 2>&1
if %errorlevel% neq 0 (
    echo [%date% %time%] Backend not responding...
    set /a backend_attempts+=1
    
    if !backend_attempts! LEQ %MAX_RESTART_ATTEMPTS% (
        echo [%date% %time%] Restarting Backend (attempt !backend_attempts!/%MAX_RESTART_ATTEMPTS%)...
        
        REM Kill existing backend
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":8000" 2^>nul') do (
            taskkill /pid %%i /f 2>nul
        )
        
        REM Wait before restart
        timeout /t %RESTART_DELAY% /nobreak >nul
        
        REM Start backend
        cd /d "%~dp0backend"
        start "DSQ Backend 24/7" cmd /c "title DSQ Backend 24/7 && echo Backend Auto-Restarted at %date% %time% && %PYTHON_CMD% -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 --log-level info >> ..\logs\backend.log 2>&1"
        
        timeout /t 15 /nobreak >nul
    ) else (
        echo [%date% %time%] ❌ Backend failed to restart after %MAX_RESTART_ATTEMPTS% attempts!
        echo Check logs at: %~dp0logs\backend.log
    )
) else (
    set "backend_attempts=0"
    echo [%date% %time%] ✓ Backend OK
)

REM Check Frontend
curl -s -m 5 http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo [%date% %time%] Frontend not responding...
    set /a frontend_attempts+=1
    
    if !frontend_attempts! LEQ %MAX_RESTART_ATTEMPTS% (
        echo [%date% %time%] Restarting Frontend (attempt !frontend_attempts!/%MAX_RESTART_ATTEMPTS%)...
        
        REM Kill existing frontend
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5173" 2^>nul') do (
            taskkill /pid %%i /f 2>nul
        )
        
        REM Wait before restart
        timeout /t %RESTART_DELAY% /nobreak >nul
        
        REM Start frontend
        cd /d "%~dp0frontend\dist"
        start "DSQ Frontend 24/7" cmd /c "title DSQ Frontend 24/7 && echo Frontend Auto-Restarted at %date% %time% && %PYTHON_CMD% -m http.server 5173 >> ..\..\logs\frontend.log 2>&1"
        
        timeout /t 10 /nobreak >nul
    ) else (
        echo [%date% %time%] ❌ Frontend failed to restart after %MAX_RESTART_ATTEMPTS% attempts!
        echo Check logs at: %~dp0logs\frontend.log
    )
) else (
    set "frontend_attempts=0"
    echo [%date% %time%] ✓ Frontend OK
)

REM Wait before next check
timeout /t %CHECK_INTERVAL% /nobreak >nul

REM Check if user wants to stop (check for Ctrl+C or window close)
goto check_services

:end
echo Monitoring stopped.
pause

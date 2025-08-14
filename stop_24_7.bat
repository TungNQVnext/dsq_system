@echo off
echo ========================================
echo   STOPPING DSQ SYSTEM (24/7 Mode)
echo ========================================
echo.

echo Stopping DSQ System processes...

REM Kill processes by window title
echo Stopping Backend...
for /f "tokens=2" %%i in ('tasklist /fi "windowtitle eq DSQ Backend 24/7" /fo csv ^| findstr /v "Image Name"') do (
    if not "%%i"=="" (
        taskkill /pid %%i /f 2>nul
        echo ✓ Backend process stopped
    )
)

echo Stopping Frontend...
for /f "tokens=2" %%i in ('tasklist /fi "windowtitle eq DSQ Frontend 24/7" /fo csv ^| findstr /v "Image Name"') do (
    if not "%%i"=="" (
        taskkill /pid %%i /f 2>nul
        echo ✓ Frontend process stopped
    )
)

REM Alternative method - kill by port
echo Stopping processes on ports 8000 and 5173...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":8000"') do (
    taskkill /pid %%i /f 2>nul
)

for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5173"') do (
    taskkill /pid %%i /f 2>nul
)

echo.
echo ========================================
echo DSQ System Stopped Successfully!
echo ========================================
echo.
pause

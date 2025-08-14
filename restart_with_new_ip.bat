@echo off
setlocal enabledelayedexpansion
echo ================================================
echo   RESTARTING DSQ SYSTEM WITH CURRENT IP
echo ================================================

echo Stopping existing services...
taskkill /f /im python.exe /t 2>nul
taskkill /f /im py.exe /t 2>nul
taskkill /f /im uvicorn.exe /t 2>nul
timeout /t 3 /nobreak >nul

echo Getting current IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "MACHINE_IP=%%a"
    set "MACHINE_IP=!MACHINE_IP: =!"
    goto :ip_found
)
:ip_found
echo Current IP: %MACHINE_IP%

echo Updating frontend .env with current IP...
echo VITE_API_URL=http://%MACHINE_IP%:8000 > frontend\.env

echo Rebuilding frontend with new IP...
cd frontend
call npm run build
cd ..

echo Starting services with SPA server...
call run_24_7.bat

echo.
echo ================================================
echo   CLEAR YOUR BROWSER CACHE AND RELOAD PAGE!
echo   URL: http://%MACHINE_IP%:5173
echo ================================================
echo.
echo Press Ctrl+F5 or clear browser cache to reload
echo the application with the new IP configuration.
pause

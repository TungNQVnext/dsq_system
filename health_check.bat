@echo off
echo ========================================
echo    DSQ SYSTEM - HEALTH CHECK
echo ========================================
echo.

set "timestamp=%date% %time%"
echo Health Check started at: %timestamp%
echo.

REM Check if services are running
echo [1/6] Checking Services Status...
sc query "DSQ-Backend" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ DSQ-Backend service is installed
    for /f "tokens=*" %%a in ('sc query "DSQ-Backend" ^| findstr "STATE"') do echo   %%a
) else (
    echo ✗ DSQ-Backend service not found
)

sc query "DSQ-Frontend" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ DSQ-Frontend service is installed
    for /f "tokens=*" %%a in ('sc query "DSQ-Frontend" ^| findstr "STATE"') do echo   %%a
) else (
    echo ✗ DSQ-Frontend service not found
)

echo.
echo [2/6] Checking Network Connectivity...
curl -s http://localhost:8000/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend API is responding (Port 8000)
) else (
    echo ✗ Backend API is not responding
)

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend is responding (Port 5173)
) else (
    echo ✗ Frontend is not responding
)

echo.
echo [3/6] Checking Process Memory Usage...
for /f "tokens=1,2" %%a in ('tasklist /fi "imagename eq python.exe" /fo csv ^| findstr /v "Image Name"') do (
    if not "%%a"=="" (
        echo Python Process: %%a - Memory: %%b
    )
)

for /f "tokens=1,2" %%a in ('tasklist /fi "imagename eq uvicorn.exe" /fo csv ^| findstr /v "Image Name"') do (
    if not "%%a"=="" (
        echo Uvicorn Process: %%a - Memory: %%b
    )
)

echo.
echo [4/6] Checking Disk Space...
for /f "tokens=1,2,3" %%a in ('wmic logicaldisk where "DeviceID='C:'" get DeviceID^,FreeSpace^,Size /format:csv ^| findstr /v /c:"Node"') do (
    if not "%%c"=="" (
        set /a freepct=%%b*100/%%c
        echo Drive C: - Free: %%b bytes (%%freepct%%)
        if %%freepct LSS 10 (
            echo ⚠️  WARNING: Low disk space!
        )
    )
)

echo.
echo [5/6] Checking Database...
if exist "%~dp0dsq.db" (
    echo ✓ Database file exists
    for %%f in ("%~dp0dsq.db") do echo   Size: %%~zf bytes
) else (
    echo ✗ Database file not found!
)

echo.
echo [6/6] Checking Log Files...
if exist "%~dp0logs" (
    echo ✓ Logs directory exists
    dir "%~dp0logs\*.log" /b 2>nul | find /c /v "" >temp_count.txt
    set /p logcount=<temp_count.txt
    del temp_count.txt
    echo   Log files found: %logcount%
    
    REM Check for recent errors
    if exist "%~dp0logs\backend_error.log" (
        for %%f in ("%~dp0logs\backend_error.log") do (
            if %%~zf GTR 0 (
                echo ⚠️  Backend errors detected in log
            )
        )
    )
) else (
    echo ✗ Logs directory not found
)

echo.
echo ========================================
echo Health Check completed at: %date% %time%
echo ========================================
echo.

REM Save health check to log
echo %timestamp% - Health Check completed >> "%~dp0logs\health_check.log" 2>nul

pause

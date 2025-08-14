@echo off
echo Testing printer status...
curl -X GET http://192.168.12.20:8000/printer-status
echo.
echo.
echo Testing thermal print with sample content...
curl -X POST http://192.168.12.20:8000/run-thermal-print ^
  -H "Content-Type: application/json" ^
  -d "{\"content\":\"TEST PRINT\\nSo: 123\\nNgay: 2025-08-14\"}"
echo.
pause

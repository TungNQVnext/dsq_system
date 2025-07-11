@echo off
echo 🧹 Dọn dẹp các file __pycache__...
echo.

REM Xóa tất cả các thư mục __pycache__
for /d /r . %%d in (__pycache__) do (
    if exist "%%d" (
        echo Đang xóa: %%d
        rmdir /s /q "%%d"
    )
)

echo.
echo ✅ Hoàn thành việc dọn dẹp __pycache__!
echo.
pause

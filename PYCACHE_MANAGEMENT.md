# Quản lý __pycache__ Files

Dự án này cung cấp nhiều cách để quản lý các file `__pycache__` được tạo bởi Python.

## File __pycache__ là gì?

- Các file `__pycache__` là file cache được Python tạo tự động
- Chúng chứa bytecode đã biên dịch để tăng tốc độ import module
- Không cần commit vào Git repository
- Có thể xóa an toàn và sẽ được tạo lại khi cần

## Cách xóa __pycache__

### 1. Sử dụng Python Script
```bash
python clean_pycache.py
```

### 2. Sử dụng PowerShell Script
```powershell
.\clean_pycache.ps1
```

### 3. Sử dụng Batch File
```cmd
clean_pycache.bat
```

### 4. Sử dụng PowerShell Command
```powershell
Get-ChildItem -Path . -Recurse -Name "__pycache__" -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force; Write-Host "Deleted: $_" }
```

### 5. Xóa thủ công với find (Git Bash)
```bash
find . -type d -name "__pycache__" -exec rm -rf {} +
```

## Ngăn chặn tạo __pycache__

### Tạm thời (chỉ cho session hiện tại)
```bash
export PYTHONDONTWRITEBYTECODE=1
```

### Vĩnh viễn trong dự án
Thêm vào file `.env`:
```
PYTHONDONTWRITEBYTECODE=1
```

### Cho một lệnh cụ thể
```bash
PYTHONDONTWRITEBYTECODE=1 python your_script.py
```

## Git Configuration

File `.gitignore` đã được cấu hình để loại trừ:
- `__pycache__/`
- `*.pyc`
- `*.pyo`
- `*.pyd`
- Virtual environments (`venv/`, `.venv/`)

## Best Practices

1. **Luôn thêm `__pycache__` vào .gitignore**
2. **Định kỳ dọn dẹp các file cache**
3. **Sử dụng virtual environment riêng biệt cho mỗi dự án**
4. **Không commit file database (.db) trừ khi cần thiết**
5. **Xóa __pycache__ trước khi deploy production**

## Automation

Bạn có thể thêm script dọn dẹp vào:
- Pre-commit hooks
- CI/CD pipeline
- Task scheduler
- VS Code tasks

## Troubleshooting

### Lỗi Permission Denied
- Chạy terminal với quyền Administrator
- Đảm bảo không có process Python nào đang chạy

### File bị khóa
- Đóng tất cả IDE/editor
- Đóng tất cả Python processes
- Restart terminal

### Thư mục không tồn tại
- Kiểm tra đường dẫn
- Đảm bảo đang ở đúng thư mục dự án

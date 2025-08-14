# DSQ Queue System - Quick Guide

## 🚀 Cách chạy system

### Chạy system 24/7
```
run_24_7.bat                # Chạy production mode
start_with_monitor.bat      # Chạy + auto-monitor
```

### Dừng system
```
stop_24_7.bat               # Dừng toàn bộ system
```

### Theo dõi system (riêng biệt)
```
monitor_24_7.bat            # chạy sau run_24_7.bat để auto-restart
```

### Kiểm tra sức khỏe system
```
health_check.bat
```

## 🌐 Truy cập

- **System**: http://[AUTO_IP]:5173/ (IP tự động phát hiện)
- **API**: http://[AUTO_IP]:8000/docs

## 📁 Files quan trọng

| File | Mục đích |
|------|----------|
| `run_24_7.bat` | Production 24/7 mode |
| `start_with_monitor.bat` | Production + Auto-monitor |
| `stop_24_7.bat` | Dừng system |
| `monitor_24_7.bat` | Auto-restart monitoring |
| `health_check.bat` | System health check |

## ⚙️ Cấu hình

- Backend: Port 8000
- Frontend: Port 5173  
- IP: Tự động lấy từ máy hiện tại
- .env files: Được backend/frontend tự quản lý

import os
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import subprocess
import sys
import tempfile
from routes.login.routes import router as auth_router
from routes.user_management.routes import router as user_management_router
from routes.touchpad_display.routes import router as touchpad_display_router
from routes.return_number.routes import router as return_router
from routes.receive_number.routes import router as receive_router
from routes.print.routes import router as print_router
from websocket_backend.return_number.ws_handler import websocket_endpoint
from websocket_backend.receive_number.ws_handler import websocket_endpoint as receive_websocket_endpoint
from db.database import Base, engine
import socket
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load .env
backend_env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
frontend_env_path = Path(__file__).resolve().parent.parent / "frontend" / ".env"

def get_local_ip():
    try:
        # Try to connect to external address to get the correct local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Google DNS
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            # Fallback to hostname method
            hostname = socket.gethostname()
            ip = socket.gethostbyname(hostname)
            if not ip.startswith("127."):
                return ip
        except Exception:
            pass
        return "127.0.0.1"

def update_env_file(ip,env_path):
    lines = []
    updated = False
    if os.path.exists(env_path):
        try:
            # Try different encodings to handle BOM and other issues
            for encoding in ['utf-8-sig', 'utf-8', 'cp1252', 'latin1']:
                try:
                    with open(env_path, "r", encoding=encoding) as f:
                        for line in f:
                            if line.startswith("VITE_API_URL=http://"):
                                lines.append(f"VITE_API_URL=http://{ip}:8000\n")
                                updated = True
                            else:
                                lines.append(line)
                    break
                except UnicodeDecodeError:
                    continue
        except Exception as e:
            print(f"Warning: Could not read {env_path}: {e}")
            lines = []
    if not updated:
        lines.append(f"VITE_API_URL=http://{ip}:8000\n")
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

current_ip = get_local_ip()
update_env_file(current_ip, backend_env_path)
update_env_file(current_ip, frontend_env_path)
print(f"[INFO] Updated VITE_API_URL in .env: {current_ip}")

def get_frontend_origin_from_env():
    load_dotenv(backend_env_path, override=True)
    vite_api_url = os.getenv("VITE_API_URL", f"http://{current_ip}:8000")
    parsed = urlparse(vite_api_url)
    return f"{parsed.scheme}://{parsed.hostname}:5173"

frontend_origin = get_frontend_origin_from_env()

app = FastAPI()

allow_origins = [
    frontend_origin,
    "http://localhost:5173",
    f"http://{current_ip}:5173",
    "http://192.168.137.1:5173",
    "http://192.168.1.107:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/auth")
app.include_router(user_management_router, prefix="/admin")
app.include_router(touchpad_display_router)
app.include_router(return_router, prefix="/return_record")
app.include_router(receive_router, prefix="/receive_number")
app.include_router(print_router, prefix="/print")

# Thermal print request model
class ThermalPrintRequest(BaseModel):
    content: str
    printer_name: Optional[str] = None

class PrintTicketRequest(BaseModel):
    number: str

# Print ticket log endpoint  
@app.post("/call/print-ticket")
async def log_print_ticket(request: PrintTicketRequest):
    """
    Endpoint để log việc in ticket (chỉ để ghi log)
    """
    try:
        # Có thể log vào database hoặc file nếu cần
        return {
            "success": True,
            "message": f"Print logged for ticket {request.number}"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Log error: {str(e)}"
        }

# Simple test endpoint
@app.get("/test-simple")
async def test_simple():
    """Simple test endpoint"""
    return {"status": "OK", "message": "API is working"}

# Test printer without subprocess
@app.get("/test-printer-direct")
async def test_printer_direct():
    """Test printer directly without subprocess"""
    try:
        import win32print
        printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        return {
            "status": "OK",
            "printers": printers,
            "count": len(printers)
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e)
        }

# Printer status endpoint
@app.get("/printer-status")
async def get_printer_status():
    """
    Endpoint để kiểm tra trạng thái máy in
    """
    try:
        # Đường dẫn tới script silent
        script_path = os.path.join(os.path.dirname(__file__), "scripts", "thermal_print_silent.py")
        
        # Chạy script với tham số check để kiểm tra printer
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0  # SW_HIDE
        
        result = subprocess.run(
            [sys.executable, script_path, "--check"],
            capture_output=True,
            text=True,
            timeout=10,
            startupinfo=startupinfo,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        
        # Parse stdout để lấy thông tin máy in
        available_printers = []
        if result.stdout:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if 'Available printers:' in line or 'Printer found:' in line:
                    # Extract printer names
                    printers = line.split(':')[-1].strip()
                    if printers:
                        available_printers = [p.strip() for p in printers.split(',') if p.strip()]
        
        return {
            "status": "online" if result.returncode == 0 else "offline",
            "available_printers": available_printers,
            "message": "Printer status checked successfully"
        }
        
    except subprocess.TimeoutExpired:
        return {
            "status": "timeout",
            "available_printers": [],
            "message": "Printer check timeout"
        }
    except Exception as e:
        return {
            "status": "error",
            "available_printers": [],
            "message": f"Error checking printer: {str(e)}"
        }

# Direct thermal print endpoint
@app.post("/run-thermal-print")
async def run_thermal_print(request: ThermalPrintRequest):
    """
    Endpoint để chạy thermal print script trực tiếp
    """
    try:
        # Đường dẫn tới script silent (không hiện cửa sổ)
        script_path = os.path.join(os.path.dirname(__file__), "scripts", "thermal_print_silent.py")
        
        # Sử dụng temp file để tránh vấn đề với command line arguments
        try:
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as temp_file:
                temp_file.write(request.content)
                temp_file_path = temp_file.name
            
            # Chạy script với SILENT mode - không hiện cửa sổ
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = 0  # SW_HIDE
            
            result = subprocess.run(
                [sys.executable, script_path, f"@{temp_file_path}"],
                capture_output=True,
                text=True,
                timeout=15,
                startupinfo=startupinfo,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            
            # Cleanup temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
        except subprocess.TimeoutExpired as e:
            print(f"[ERROR] Subprocess timeout: {e}")
            raise HTTPException(status_code=408, detail="Print timeout")
        except Exception as e:
            print(f"[ERROR] Subprocess error: {e}")
            raise HTTPException(status_code=500, detail=f"Subprocess error: {str(e)}")
        
        success = result.returncode == 0
        
        return {
            "success": success,
            "message": "Print completed" if success else "Print failed",
            "stdout": result.stdout,
            "stderr": result.stderr if not success else ""
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Print timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Print error: {str(e)}")

#  Mount WebSocket endpoints
@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

@app.websocket("/receive-ws")
async def receive_websocket_route(websocket: WebSocket):
    await receive_websocket_endpoint(websocket)

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from authentication.routes import router as auth_router
from touchpad_display.routes import router as call_router
from return_number.routes import router as return_router
from websocket_backend.ws_handler import websocket_endpoint  # ✅ import WebSocket handler
from db.database import Base, engine
from models import user
import socket
import os
from pathlib import Path

def get_local_ip():
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
        if ip.startswith("127."):
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("192.168.1.1"),1)
            ip = s.getsockname()[0]
            s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def update_env_file(ip,env_path):
    lines = []
    updated = False
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("VITE_API_URL=http://"):
                    lines.append(f"VITE_API_URL=http://{ip}:8000\n")
                    updated = True
                else:
                    lines.append(line)
    if not updated:
        lines.append(f"VITE_API_URL=http://{ip}:8000\n")
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

backend_env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
frontend_env_path = Path(__file__).resolve().parent.parent / "frontend" / ".env"
current_ip = get_local_ip()
update_env_file(current_ip, backend_env_path)
update_env_file(current_ip, frontend_env_path)
print(f"[INFO] Updated VITE_API_URL in .env: {current_ip}")
# Khởi tạo FastAPI
app = FastAPI()

# Cho phép CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo DB
Base.metadata.create_all(bind=engine)

# Gắn router
app.include_router(auth_router, prefix="/auth")
app.include_router(call_router)
app.include_router(return_router, prefix="/return_record")

#  Mount WebSocket endpoint
@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

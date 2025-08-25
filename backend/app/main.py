"""
Main FastAPI application with refactored structure
"""
import os
import socket
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import Base, engine
from app.config.settings import settings
from app.api.routes import api_router


def get_local_ip() -> str:
    """Get local IP address"""
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


def update_env_file(ip: str, env_path: Path):
    """Update .env file with current IP"""
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


def get_frontend_origin_from_env() -> str:
    """Get frontend origin from environment variables"""
    load_dotenv(settings.backend_env_path, override=True)
    vite_api_url = os.getenv("VITE_API_URL", f"http://{current_ip}:8000")
    parsed = urlparse(vite_api_url)
    return f"{parsed.scheme}://{parsed.hostname}:5173"


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    # Update IP in environment files
    current_ip = get_local_ip()
    update_env_file(current_ip, settings.backend_env_path)
    update_env_file(current_ip, settings.frontend_env_path)
    print(f"[INFO] Updated VITE_API_URL in .env: {current_ip}")
    
    # Get frontend origin
    frontend_origin = get_frontend_origin_from_env()
    
    # Create FastAPI app
    app = FastAPI(
        title="DSQ System API",
        description="Digital Queue System Backend API",
        version="2.0.0"
    )
    
    # Configure CORS
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
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Include API routes
    app.include_router(api_router, prefix="/api/v1")
    
    # Legacy routes for backward compatibility
    from routes.login.routes import router as legacy_auth_router
    from routes.user_management.routes import router as legacy_user_router
    from routes.touchpad_display.routes_clean import router as legacy_touchpad_router
    from routes.return_number.routes import router as legacy_return_router
    from routes.receive_number.routes import router as legacy_receive_router
    from routes.print.routes_clean import router as legacy_print_router
    
    app.include_router(legacy_auth_router, prefix="/auth", tags=["Legacy Auth"])
    app.include_router(legacy_user_router, prefix="/admin", tags=["Legacy Admin"])
    app.include_router(legacy_touchpad_router, prefix="/call", tags=["Legacy Call"])
    app.include_router(legacy_return_router, prefix="/return_record", tags=["Legacy Return"])
    app.include_router(legacy_receive_router, prefix="/receive_number", tags=["Legacy Receive"])
    app.include_router(legacy_print_router, prefix="/print", tags=["Legacy Print"])
    
    return app


# Get current IP for global use
current_ip = get_local_ip()

# Create app instance
app = create_app()


# Websocket endpoints
@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    """Main websocket endpoint"""
    from websocket_backend.return_number.ws_handler import websocket_endpoint
    await websocket_endpoint(websocket)


@app.websocket("/receive-ws")
async def receive_websocket_route(websocket: WebSocket):
    """Receive number websocket endpoint"""
    from websocket_backend.receive_number.ws_handler import websocket_endpoint as receive_websocket_endpoint
    await receive_websocket_endpoint(websocket)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

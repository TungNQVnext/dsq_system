import json
import logging
import datetime
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
import asyncio
import os
import sys
import time
import webbrowser
import threading
import uvicorn

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from backend.textToSpeak import (
    add_to_queue,
    start_worker,
    normalize_number,
    set_status_callback,
    set_main_loop,
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="DSQ Call System Backend",
    description="WebSocket backend for DSQ Call System",
    version="1.0.0",
)
logging.basicConfig(
    filename="dsq.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_static_dir():
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, "static")
    return os.path.join(os.path.dirname(__file__), "static")

static_dir = get_static_dir()

@app.middleware("http")
async def serve_static_frontend(request: Request, call_next):
    full_path = os.path.join(static_dir, request.url.path.lstrip("/"))
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    elif request.method == "GET" and os.path.exists(os.path.join(static_dir, "index.html")):
        return FileResponse(os.path.join(static_dir, "index.html"))
    return await call_next(request)

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Send error: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        logger.info(f"Broadcasting to {len(self.active_connections)} clients")
        to_remove = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                to_remove.append(conn)
        for conn in to_remove:
            self.disconnect(conn)

manager = ConnectionManager()

# TTS worker setup
async def broadcast_status(message_dict):
    await manager.broadcast(json.dumps(message_dict))

set_status_callback(broadcast_status)
set_main_loop(asyncio.get_event_loop())
start_worker()

@app.get("/health")
async def health_check():
    return JSONResponse({
        "status": "healthy",
        "connections": len(manager.active_connections),
        "ws": "/ws",
    })

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")
            try:
                message = json.loads(data)
                if not isinstance(message, dict):
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": "Invalid format"}),
                        websocket
                    )
                    continue

                msg_type = message.get("type")

                if msg_type == "call":
                    number = message.get("number")
                    if not number:
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Missing number"}),
                            websocket
                        )
                        continue

                    cleaned = normalize_number(number)
                    metadata = message.get("metadata", {})

                    call_message = json.dumps({
                        "type": "call",
                        "number": cleaned,
                        "metadata": metadata,
                        "timestamp": datetime.datetime.now().isoformat(),
                    })

                    add_to_queue(cleaned, metadata.get("language"))
                    await manager.broadcast(call_message)

                    await manager.send_personal_message(
                        json.dumps({"type": "confirmation", "message": f"Called {cleaned}"}),
                        websocket
                    )

                elif msg_type == "complete":
                    counter = message.get("counter")
                    number = message.get("number")
                    if not counter:
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Missing counter"}),
                            websocket
                        )
                        continue

                    complete_message = json.dumps({
                        "type": "complete",
                        "counter": counter,
                        "number": number,
                        "timestamp": datetime.datetime.now().isoformat(),
                    })
                    await manager.broadcast(complete_message)
                    await manager.send_personal_message(
                        json.dumps({"type": "confirmation", "message": "Completion broadcasted"}),
                        websocket
                    )

                elif msg_type == "skip":
                    number = message.get("number")
                    counter = message.get("counter")
                    if not number or not counter:
                        await manager.send_personal_message(
                            json.dumps({"type": "error", "message": "Missing number or counter"}),
                            websocket
                        )
                        continue

                    skip_message = json.dumps({
                        "type": "skip",
                        "number": number,
                        "counter": counter,
                        "timestamp": datetime.datetime.now().isoformat(),
                    })
                    await manager.broadcast(skip_message)
                    await manager.send_personal_message(
                        json.dumps({"type": "confirmation", "message": "Skip broadcasted"}),
                        websocket
                    )

                elif msg_type == "ping":
                    await manager.send_personal_message(json.dumps({"type": "pong"}), websocket)

                else:
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": f"Unknown type: {msg_type}"}),
                        websocket
                    )

            except json.JSONDecodeError:
                logger.error("Invalid JSON")
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Invalid JSON"}),
                    websocket
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected")
    except Exception as e:
        manager.disconnect(websocket)
        logger.error(f"Unexpected error: {e}")

def open_browser_tabs():
    time.sleep(1.5)
    webbrowser.open("http://localhost:8000")
    webbrowser.open("http://localhost:8000/tv")

if __name__ == "__main__":
    try:
        threading.Thread(target=open_browser_tabs, daemon=True).start()
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    except Exception as e:
        print("Lỗi :", e)
        input("Nhấn enter")


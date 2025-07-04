import json
import logging
import datetime
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

from textToSpeak import (
    add_to_queue,
    start_worker,
    normalize_number,
    set_status_callback,
    set_main_loop,
)

logger = logging.getLogger(__name__)

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
pending_calls = []

async def broadcast_status(message_dict):
    await manager.broadcast(json.dumps(message_dict))

# setup
set_status_callback(broadcast_status)
set_main_loop(asyncio.get_event_loop())
start_worker()

async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    # resend pending calls
    for call in pending_calls:
        try:
            await websocket.send_text(json.dumps({
                "type": "call",
                "number": call["number"],
                "metadata": call["metadata"],
            }))
        except Exception as e:
            logger.warning(f" Failed to resend pending call to client: {e}")

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f" RAW WebSocket message: {data}")
            try:
                message = json.loads(data)
                logger.info(f" Parsed message: {message}")
                
                if not isinstance(message, dict):
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": "Invalid format"}),
                        websocket
                    )
                    continue

                msg_type = message.get("type")
                logger.info(f" msg_type: {msg_type}")

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
                    pending_calls.append({
                        "number": cleaned,
                        "metadata": metadata
                    })

                    await manager.broadcast(call_message)

                    await manager.send_personal_message(
                        json.dumps({"type": "confirmation", "message": f"Called {cleaned}"}),
                        websocket
                    )

                elif msg_type == "complete":
                    counter = message.get("counter")
                    number = message.get("number")

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

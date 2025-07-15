import json
import logging
import datetime
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from textToSpeak.receiveNumber import (
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

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.warning(f"Failed to send personal message: {e}")

    async def broadcast(self, message: str):
        if not self.active_connections:
            logger.warning("No active connections to broadcast to")
            return
            
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to broadcast to connection: {e}")
                self.disconnect(connection)

manager = ConnectionManager()
pending_calls = []

async def broadcast_status(message_dict):
    """Broadcast status updates to all connected clients"""
    try:
        message = json.dumps(message_dict)
        await manager.broadcast(message)
    except Exception as e:
        logger.error(f"Error broadcasting status: {e}")

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
            logger.warning(f"Failed to resend pending call to client: {e}")

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"RAW WebSocket message: {data}")
            try:
                message = json.loads(data)
                logger.info(f"Parsed message: {message}")
                
                if not isinstance(message, dict):
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": "Invalid format"}),
                        websocket
                    )
                    continue

                msg_type = message.get("type")
                logger.info(f"msg_type: {msg_type}")

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

                    # Remove from pending calls - no need for global since we're not reassigning
                    for i, call in enumerate(pending_calls):
                        if call["number"] == number:
                            pending_calls.pop(i)
                            break

                    await manager.send_personal_message(
                        json.dumps({"type": "confirmation", "message": f"Completed {number}"}),
                        websocket
                    )

                elif msg_type == "call_number_updated":
                    # Broadcast the update to all connected clients
                    update_message = json.dumps({
                        "type": "call_number_updated",
                        "data": message.get("data", {}),
                        "timestamp": datetime.datetime.now().isoformat(),
                    })
                    
                    await manager.broadcast(update_message)

                else:
                    await manager.send_personal_message(
                        json.dumps({"type": "error", "message": f"Unknown message type: {msg_type}"}),
                        websocket
                    )

            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({"type": "error", "message": "Invalid JSON"}),
                    websocket
                )

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)

"""
Simple websocket manager
"""
import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages websocket connections"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Connect a new websocket"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Disconnect a websocket"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific websocket"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Send error: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        logger.info(f"Broadcasting to {len(self.active_connections)} clients")
        to_remove = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                to_remove.append(conn)
        
        # Remove failed connections
        for conn in to_remove:
            self.disconnect(conn)


# Global manager instance
manager = ConnectionManager()

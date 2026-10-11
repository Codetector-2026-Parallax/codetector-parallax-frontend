from typing import Dict, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        # Maps team_id -> set of active WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, team_id: int, websocket: WebSocket):
        await websocket.accept()
        if team_id not in self.active_connections:
            self.active_connections[team_id] = set()
        self.active_connections[team_id].add(websocket)
        logger.info(f"Team {team_id}: Client connected. Total clients: {len(self.active_connections[team_id])}")

    def disconnect(self, team_id: int, websocket: WebSocket):
        if team_id in self.active_connections:
            self.active_connections[team_id].discard(websocket)
            if not self.active_connections[team_id]:
                del self.active_connections[team_id]
        logger.info(f"Team {team_id}: Client disconnected.")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast_to_team(self, team_id: int, message: dict):
        if team_id not in self.active_connections:
            return

        dead_connections = set()
        payload = json.dumps(message)
        for connection in self.active_connections[team_id]:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send WS message to a client in team {team_id}: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections[team_id].discard(dead)


ws_manager = WebSocketManager()

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.core.websocket_manager import ws_manager
from app.models.team import Team
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/team")
async def team_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token của đội thi"),
):
    """
    Kênh WebSocket kết nối đồng bộ thời gian thực giữa các thành viên cùng một đội.
    Nhận JWT qua query parameter: ws://backend:8000/ws/team?token=...
    """
    # 1. Xác thực Token
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid or expired token")
        return

    team_id_raw = payload.get("sub") or payload.get("team_id")
    if not team_id_raw:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing team ID")
        return

    team_id = int(team_id_raw)

    # 2. Lấy thông tin hiện tại của team
    async with AsyncSessionLocal() as session:
        stmt = select(Team).where(Team.id == team_id)
        result = await session.execute(stmt)
        team = result.scalar_one_or_none()
        if not team or not team.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Team not found or inactive")
            return
        current_stage = team.current_stage

    # 3. Chấp nhận kết nối vào phòng của đội
    await ws_manager.connect(team_id, websocket)

    # 4. Gửi sự kiện đồng bộ trạng thái ban đầu (SYNC_STATE)
    await ws_manager.send_personal_message(
        {
            "event": "SYNC_STATE",
            "team_id": team_id,
            "team_name": payload.get("team_name"),
            "current_stage": current_stage,
            "message": "Đã kết nối thành công tới phòng chuyên án của đội."
        },
        websocket
    )

    try:
        # Lắng nghe các tin nhắn ping/heartbeat từ client
        while True:
            data = await websocket.receive_text()
            # Phản hồi pong nếu client gửi ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(team_id, websocket)
    except Exception as exc:
        logger.warning(f"WebSocket error on team {team_id}: {exc}")
        ws_manager.disconnect(team_id, websocket)


@router.websocket("/ws/leaderboard")
async def leaderboard_websocket_endpoint(websocket: WebSocket):
    """
    Kênh WebSocket công khai theo dõi Bảng Xếp Hạng trực tiếp (real-time).
    Không yêu cầu JWT token (dành cho màn hình trình chiếu hoặc khán giả/đội thi).
    """
    await ws_manager.connect_public(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect_public(websocket)
    except Exception as exc:
        logger.warning(f"Public WebSocket error: {exc}")
        ws_manager.disconnect_public(websocket)


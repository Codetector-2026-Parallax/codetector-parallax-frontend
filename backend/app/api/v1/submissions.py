from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_team
from app.core.database import get_db
from app.core.websocket_manager import ws_manager
from app.models.stage import Stage
from app.models.submission import Submission
from app.models.team import Team
from app.schemas.game import SubmitRequest, SubmitResponse
from app.game_content import TOTAL_QUESTIONS

router = APIRouter(prefix="/submissions", tags=["Submissions"])


def normalize_str(val: str) -> str:
    """Chuẩn hóa chuỗi để so sánh đáp án (bỏ khoảng trắng thừa, viết thường)."""
    if not val:
        return ""
    return " ".join(val.strip().lower().split())


@router.post("/submit", response_model=SubmitResponse)
async def submit_answers(
    req: SubmitRequest,
    team: Team = Depends(get_current_team),
    db: AsyncSession = Depends(get_db)
):
    """
    Nộp form đáp án cho màn chơi hiện tại.
    Chỉ khi tất cả các trường đều chính xác, đội mới được qua màn.
    Đồng thời phát tín hiệu WebSocket để toàn bộ thành viên trong đội đổi màn đồng loạt.
    """
    # Lock progress so simultaneous submissions cannot skip a question.
    locked_team = await db.execute(select(Team).where(Team.id == team.id).with_for_update().execution_options(populate_existing=True))
    team = locked_team.scalar_one()
    if team.current_stage > TOTAL_QUESTIONS:
        raise HTTPException(status_code=400, detail="Đội của bạn đã hoàn thành Chặng 1.")
    if req.question_number is not None and req.question_number != team.current_stage:
        raise HTTPException(status_code=409, detail="Chỉ được trả lời câu hỏi đang mở. Hãy tải lại tiến độ của đội.")

    # 1. Lấy thông tin câu hỏi hiện tại của đội
    stmt = select(Stage).where(Stage.stage_number == team.current_stage)
    result = await db.execute(stmt)
    stage = result.scalar_one_or_none()

    if not stage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đội của bạn đã hoàn thành tất cả các màn chơi, không thể nộp thêm.",
        )

    correct_answers: Dict[str, Any] = stage.correct_answers or {}
    submitted_answers: Dict[str, str] = req.answers or {}

    failed_fields: List[str] = []

    # 2. Đối chiếu từng trường trong form đáp án
    for key, answer_config in correct_answers.items():
        correct_val = answer_config.get("value", "") if isinstance(answer_config, dict) else answer_config
        user_val = submitted_answers.get(key, "")
        if normalize_str(str(user_val)) != normalize_str(str(correct_val)):
            failed_fields.append(key)

    is_correct = (len(failed_fields) == 0)

    # 3. Ghi nhận lịch sử submit
    submission = Submission(
        team_id=team.id,
        stage_id=stage.id,
        submitted_answers=submitted_answers,
        is_correct=is_correct,
        failed_keys=failed_fields if failed_fields else None,
    )
    db.add(submission)

    # 4. Nếu trả lời đúng toàn bộ các trường -> Tăng current_stage & Broadcast WebSocket
    if is_correct:
        team.current_stage += 1
        await db.commit()
        await db.refresh(team)

        # Lấy thông tin tiêu đề màn tiếp theo (nếu có)
        next_stmt = select(Stage.title).where(Stage.stage_number == team.current_stage)
        next_result = await db.execute(next_stmt)
        next_title = next_result.scalar_one_or_none()

        # Phát tín hiệu Real-time cho mọi client của đội này
        await ws_manager.broadcast_to_team(
            team.id,
            {
                "event": "STAGE_CLEARED",
                "completed_stage": stage.stage_number,
                "next_stage": team.current_stage,
                "next_title": next_title or "Hoàn thành Chặng 1",
                "chapter_completed": team.current_stage > TOTAL_QUESTIONS,
                "message": f"Tuyệt vời! Đội đã phá giải thành công {stage.title}!"
            }
        )

        # Phát tín hiệu cập nhật Bảng xếp hạng cho toàn bộ các đội thi (Realtime Leaderboard)
        await ws_manager.broadcast_all(
            {
                "event": "LEADERBOARD_UPDATED",
                "team_id": team.id,
                "team_name": team.team_name,
                "completed_stage": stage.stage_number,
                "new_stage": team.current_stage,
                "stage_number": 1,
                "question_number": stage.stage_number,
            }
        )

        return SubmitResponse(
            is_correct=True,
            message="Chúc mừng! Đội đã hoàn thành Chặng 1." if team.current_stage > TOTAL_QUESTIONS else "Chính xác! Câu hỏi tiếp theo đã được mở khóa.",
            next_stage=team.current_stage,
            failed_fields=None,
            chapter_completed=team.current_stage > TOTAL_QUESTIONS,
        )
    else:
        await db.commit()
        return SubmitResponse(
            is_correct=False,
            message="Đáp án chưa chính xác hoặc còn thiếu thông tin. Hãy tiếp tục điều tra!",
            next_stage=None,
            failed_fields=failed_fields,
        )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_team
from app.core.database import get_db
from app.models.stage import Stage
from app.models.team import Team
from app.schemas.game import StageResponse

router = APIRouter(prefix="/stages", tags=["Stages"])


@router.get("/current", response_model=StageResponse)
async def get_current_stage(
    team: Team = Depends(get_current_team),
    db: AsyncSession = Depends(get_db)
):
    """Lấy dữ liệu đề bài và form câu hỏi của màn chơi hiện tại cho đội."""
    stmt = select(Stage).where(Stage.stage_number == team.current_stage)
    result = await db.execute(stmt)
    stage = result.scalar_one_or_none()

    if not stage:
        # Đã hoàn thành tất cả các màn chơi
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chúc mừng! Đội của bạn đã xuất sắc phá đảo tất cả các màn chơi của chuyên án.",
        )

    return StageResponse(
        id=stage.id,
        stage_number=stage.stage_number,
        title=stage.title,
        story_description=stage.story_description,
        clues_guide=stage.clues_guide,
        form_schema=stage.form_schema,
        is_completed=False,
    )


@router.get("/{stage_number}", response_model=StageResponse)
async def get_stage_by_number(
    stage_number: int,
    team: Team = Depends(get_current_team),
    db: AsyncSession = Depends(get_db)
):
    """Xem lại thông tin màn chơi đã qua hoặc màn hiện tại (không được xem trước màn tương lai)."""
    if stage_number > team.current_stage:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chưa mở khóa màn chơi này.",
        )

    stmt = select(Stage).where(Stage.stage_number == stage_number)
    result = await db.execute(stmt)
    stage = result.scalar_one_or_none()

    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy màn chơi số {stage_number}.",
        )

    return StageResponse(
        id=stage.id,
        stage_number=stage.stage_number,
        title=stage.title,
        story_description=stage.story_description,
        clues_guide=stage.clues_guide,
        form_schema=stage.form_schema,
        is_completed=(stage_number < team.current_stage),
    )

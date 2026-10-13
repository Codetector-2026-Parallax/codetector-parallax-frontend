from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_team
from app.core.database import get_db
from app.models.stage import Stage
from app.models.team import Team
from app.schemas.game import StageResponse, ChapterOutline, QuestionOutline
from app.game_content import CHAPTER_NUMBER, CHAPTER_TITLE, CASE_DESCRIPTION, TOTAL_QUESTIONS

router = APIRouter(prefix="/stages", tags=["Stages"])


@router.get("/outline", response_model=ChapterOutline)
async def get_outline(team: Team = Depends(get_current_team), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stage).where(Stage.stage_number.between(1, TOTAL_QUESTIONS)).order_by(Stage.stage_number))
    stages = result.scalars().all()
    completed = max(0, min(TOTAL_QUESTIONS, team.current_stage - 1))
    return ChapterOutline(
        chapter_number=CHAPTER_NUMBER, title=CHAPTER_TITLE,
        total_questions=TOTAL_QUESTIONS, completed_questions=completed,
        current_question=team.current_stage if team.current_stage <= TOTAL_QUESTIONS else None,
        is_completed=completed == TOTAL_QUESTIONS,
        questions=[QuestionOutline(
            question_number=stage.stage_number, title=stage.title,
            status="completed" if stage.stage_number < team.current_stage else "current" if stage.stage_number == team.current_stage else "locked",
        ) for stage in stages],
    )


def stage_response(stage: Stage, completed: bool) -> StageResponse:
    return StageResponse(
        id=stage.id, stage_number=stage.stage_number, title=stage.title,
        story_description=stage.story_description, clues_guide=stage.clues_guide,
        form_schema=stage.form_schema, is_completed=completed,
        chapter_number=CHAPTER_NUMBER, question_number=stage.stage_number,
        total_questions=TOTAL_QUESTIONS, case_description=CASE_DESCRIPTION,
    )


@router.get("/current", response_model=StageResponse)
async def get_current_stage(
    team: Team = Depends(get_current_team),
    db: AsyncSession = Depends(get_db)
):
    """Lấy dữ liệu đề bài và form câu hỏi của màn chơi hiện tại cho đội."""
    if team.current_stage > TOTAL_QUESTIONS:
        raise HTTPException(status_code=404, detail="Chúc mừng! Đội đã hoàn thành cả 3 câu của Chặng 1.")
    stmt = select(Stage).where(Stage.stage_number == team.current_stage)
    result = await db.execute(stmt)
    stage = result.scalar_one_or_none()

    if not stage:
        # Đã hoàn thành tất cả các màn chơi
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chúc mừng! Đội của bạn đã xuất sắc phá đảo tất cả các màn chơi của chuyên án.",
        )

    return stage_response(stage, False)


@router.get("/{stage_number}", response_model=StageResponse)
async def get_stage_by_number(
    stage_number: int,
    team: Team = Depends(get_current_team),
    db: AsyncSession = Depends(get_db)
):
    """Xem lại thông tin màn chơi đã qua hoặc màn hiện tại (không được xem trước màn tương lai)."""
    if stage_number > TOTAL_QUESTIONS or stage_number < 1:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi trong Chặng 1.")
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

    return stage_response(stage, stage_number < team.current_stage)

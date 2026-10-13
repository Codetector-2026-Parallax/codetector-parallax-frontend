from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.stage import Stage
from app.models.submission import Submission
from app.models.team import Team
from app.schemas.game import LeaderboardItem, LeaderboardResponse
from app.game_content import TOTAL_QUESTIONS

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
):
    """
    Lấy bảng xếp hạng thời gian thực giữa các đội thi.
    Chặng 1 gồm 3 câu hỏi. Ưu tiên số câu hoàn thành, rồi thời gian nộp đúng.
    """
    # 1. Lấy tất cả đội chơi đang hoạt động
    team_stmt = select(Team).where(Team.is_active == True)
    team_res = await db.execute(team_stmt)
    teams: List[Team] = list(team_res.scalars().all())

    # 2. Lấy thông tin các màn chơi (lấy stage_id theo stage_number)
    stages_stmt = select(Stage.id, Stage.stage_number).where(Stage.stage_number.between(1, TOTAL_QUESTIONS)).order_by(Stage.stage_number)
    stages_res = await db.execute(stages_stmt)
    stage_id_to_num = {row[0]: row[1] for row in stages_res.all()}

    # 3. Lấy tất cả lượt nộp đúng (is_correct = True)
    sub_stmt = (
        select(Submission.team_id, Submission.stage_id, Submission.submitted_at)
        .where(Submission.is_correct == True)
        .order_by(Submission.submitted_at.asc())
    )
    sub_res = await db.execute(sub_stmt)
    submissions = sub_res.all()

    # Nhóm thời gian nộp đúng theo team_id -> stage_number
    team_stage_times = {}
    for team_id, stage_id, submitted_at in submissions:
        stage_num = stage_id_to_num.get(stage_id)
        if not stage_num:
            continue
        if team_id not in team_stage_times:
            team_stage_times[team_id] = {}
        # Chỉ lấy mốc thời gian lần đầu tiên giải đúng của màn đó
        if stage_num not in team_stage_times[team_id]:
            team_stage_times[team_id][stage_num] = submitted_at

    # 4. Tạo danh sách và tính điểm cho từng đội
    items_raw = []
    for t in teams:
        times = team_stage_times.get(t.id, {})
        s1_time: Optional[datetime] = times.get(1)
        s2_time: Optional[datetime] = times.get(2)
        s3_time: Optional[datetime] = times.get(3)

        completed_count = max(0, min(TOTAL_QUESTIONS, t.current_stage - 1))
        last_time = times.get(completed_count)
        is_finished = completed_count == TOTAL_QUESTIONS

        items_raw.append(
            {
                "team_id": t.id,
                "team_name": t.team_name,
                "username": t.username,
                "current_stage": min(t.current_stage, TOTAL_QUESTIONS + 1),
                "completed_stages_count": completed_count,
                "stage_1_completed_at": s1_time.isoformat() if s1_time else None,
                "stage_2_completed_at": s2_time.isoformat() if s2_time else None,
                "stage_3_completed_at": s3_time.isoformat() if s3_time else None,
                "last_completed_at_dt": last_time,
                "last_completed_at": last_time.isoformat() if last_time else None,
                "is_finished": is_finished,
            }
        )

    # 5. Sắp xếp thứ hạng (Tiêu chí: Completed Stages DESC, Thời gian nộp bài cuối cùng ASC)
    def sort_key(item):
        count = item["completed_stages_count"]
        last_dt = item["last_completed_at_dt"]
        # Đội giải được nhiều chặng hơn đứng trên (-count)
        # Nếu cùng số chặng, đội có thời gian nộp sớm hơn đứng trên
        # Nếu chưa giải được chặng nào, xếp theo thứ tự đăng ký (timestamp lớn)
        dt_val = last_dt.timestamp() if last_dt else 9999999999.0
        return (-count, dt_val)

    items_sorted = sorted(items_raw, key=sort_key)

    # Gán rank 1, 2, 3...
    leaderboard_items = []
    for rank, item in enumerate(items_sorted, start=1):
        leaderboard_items.append(
            LeaderboardItem(
                rank=rank,
                team_id=item["team_id"],
                team_name=item["team_name"],
                username=item["username"],
                current_stage=item["current_stage"],
                completed_stages_count=item["completed_stages_count"],
                stage_1_completed_at=item["stage_1_completed_at"],
                stage_2_completed_at=item["stage_2_completed_at"],
                stage_3_completed_at=item["stage_3_completed_at"],
                is_finished=item["is_finished"],
                last_completed_at=item["last_completed_at"],
            )
        )

    return LeaderboardResponse(total_stages=TOTAL_QUESTIONS, total_questions=TOTAL_QUESTIONS, leaderboard=leaderboard_items)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_team
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.team import Team
from app.schemas.auth import LoginRequest, TeamResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Đăng nhập đội thi, trả về JWT access token."""
    username = req.username.strip().lower()

    stmt = select(Team).where(Team.username == username)
    result = await db.execute(stmt)
    team = result.scalar_one_or_none()

    if not team or not verify_password(req.password, team.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác.",
        )

    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đội thi đã bị khóa bởi Ban tổ chức.",
        )

    token = create_access_token(
        data={
            "sub": str(team.id),
            "team_id": team.id,
            "username": team.username,
            "team_name": team.team_name,
        }
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        team_id=team.id,
        team_name=team.team_name,
        username=team.username,
        current_stage=team.current_stage,
    )


@router.get("/me", response_model=TeamResponse)
async def get_me(
    team: Team = Depends(get_current_team)
):
    """Lấy thông tin tiến độ của đội thi hiện tại."""
    return team

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50, description="Tên đăng nhập đội thi")
    password: str = Field(..., min_length=4, max_length=100, description="Mật khẩu đội thi")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    team_id: int
    team_name: str
    username: str
    current_stage: int


class TeamResponse(BaseModel):
    id: int
    team_name: str
    username: str
    current_stage: int
    is_active: bool

    class Config:
        from_attributes = True

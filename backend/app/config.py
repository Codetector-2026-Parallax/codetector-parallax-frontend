from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import json


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres_password@localhost:5432/codetector"
    SANDBOX_DATABASE_URL: str = "postgresql+asyncpg://game_player:game_player_password@localhost:5432/codetector"

    # Security
    SECRET_KEY: str = "super-secret-key-change-this-in-production-codetector-2026-parallax"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Sandbox constraints
    SANDBOX_STATEMENT_TIMEOUT_MS: int = 3000
    SANDBOX_ROW_LIMIT: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

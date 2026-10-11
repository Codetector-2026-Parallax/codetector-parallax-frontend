from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.auth import router as auth_router
from app.api.v1.sandbox import router as sandbox_router
from app.api.v1.stages import router as stages_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.ws import router as ws_router
from app.config import settings

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("codetector")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info("   CODETECTOR 2026 - PARALLAX BACKEND STARTED   ")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    logger.info("==================================================")
    yield
    logger.info("Codetector Backend is shutting down gracefully...")


app = FastAPI(
    title="Codetector 2026 - Parallax Game API",
    description="Backend API hệ thống thi đấu CTF trinh thám SQL Sandbox và đồng bộ thời gian thực.",
    version="1.0.0",
    lifespan=lifespan,
)

# Cấu hình CORS cho phép Frontend truy cập
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các Router API
app.include_router(auth_router, prefix="/api/v1")
app.include_router(stages_router, prefix="/api/v1")
app.include_router(sandbox_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "project": "Codetector 2026 - Parallax",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

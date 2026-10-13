import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from sqlalchemy import text
from starlette.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent / ".env")

from lib import postgres  # noqa: E402
from routers.auth import router as auth_router  # noqa: E402
from routers.risk_signals import router as risk_signals_router  # noqa: E402
from routers.students import router as students_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if postgres.engine is not None:
        await postgres.engine.dispose()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(students_router)
api_router.include_router(risk_signals_router)


@api_router.get("/health")
async def health():
    """Open /api/health in the browser: tells you whether the Supabase database is reachable."""
    if postgres.SessionLocal is None:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured")
    try:
        async with postgres.SessionLocal() as session:
            await session.execute(text("SELECT 1"))
            tables = (await session.execute(text("SELECT to_regclass('public.user_profiles') IS NOT NULL AND to_regclass('public.students') IS NOT NULL"))).scalar()
    except Exception as exc:  # surfaced on purpose: this endpoint exists for debugging
        logger.exception("Database health check failed")
        raise HTTPException(status_code=503, detail=f"Database unreachable: {type(exc).__name__}: {exc}") from exc
    return {"status": "ok", "database": "connected", "tablesReady": bool(tables)}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

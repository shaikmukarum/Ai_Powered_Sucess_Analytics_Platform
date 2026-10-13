"""Async SQLAlchemy boundary for the Supabase transaction pooler."""

import os
from collections.abc import AsyncIterator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

load_dotenv(Path(__file__).parent.parent / ".env")


class Base(DeclarativeBase):
    pass


database_url = os.environ.get("DATABASE_URL")
engine = None
SessionLocal = None

if database_url:
    engine = create_async_engine(database_url, pool_pre_ping=True, pool_size=5, max_overflow=5, pool_timeout=30, connect_args={"statement_cache_size": 0, "ssl": "require"})
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with SessionLocal() as session:
        yield session
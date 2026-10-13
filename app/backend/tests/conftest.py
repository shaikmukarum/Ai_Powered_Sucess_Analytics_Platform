"""Pre-scaffolded pytest fixtures for the FastAPI backend.

Tests hit the live uvicorn process managed by supervisor (not an in-process ASGI app), so
the app under test is the same one the frontend and Playwright see. Do NOT re-create this
file — add app-specific fixtures below the marker at the bottom.
"""

import os

import httpx
import pytest
import pytest_asyncio

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8001")
API_URL = f"{BACKEND_URL}/api"


def api_url(path: str = "") -> str:
    """Absolute URL for an /api route: api_url("/status") -> http://localhost:8001/api/status."""
    return f"{API_URL}{path}"


@pytest.fixture(scope="session")
def backend_url() -> str:
    return BACKEND_URL


@pytest.fixture
def client():
    """Sync httpx client rooted at /api — the default for endpoint tests.

    Example:
        def test_status(client):
            assert client.get("/status").status_code == 200
    """
    with httpx.Client(base_url=API_URL, timeout=30.0) as c:
        yield c


@pytest_asyncio.fixture
async def aclient():
    """Async variant, for tests that also await motor/backend helpers directly."""
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as c:
        yield c


# --- app-specific fixtures below this line ---

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
import asyncpg
from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEMO_USER_IDS = {
    "admin@demo.com": None,
    "faculty@demo.com": None,
}


def _session_secret() -> str:
    return os.environ.get("SESSION_SECRET", "local-dev-session-secret")


async def _lookup_user_id(email: str) -> str:
    database_url = os.environ["DATABASE_URL"].replace("+asyncpg", "")
    conn = await asyncpg.connect(database_url, statement_cache_size=0)
    try:
        row = await conn.fetchrow("select id from auth.users where email = $1", email)
        if not row:
            raise RuntimeError(f"No Supabase auth user found for {email}")
        return str(row["id"])
    finally:
        await conn.close()


def demo_session_cookie(email: str) -> str:
    """Builds a signed application session cookie for a seeded demo identity.

    Mirrors backend lib.supabase_auth.make_session: {"sub": user_id, "email": email} signed
    with SESSION_SECRET. This lets tests exercise the real Supabase-backed data path (the
    router queries Postgres via the signed session) without needing a confirmed Supabase
    Auth login, which the demo identities currently cannot complete (see spec_deviations).
    """
    user_id = asyncio.get_event_loop().run_until_complete(_lookup_user_id(email))
    signer = URLSafeTimedSerializer(_session_secret())
    return signer.dumps({"sub": user_id, "email": email})


@pytest.fixture(scope="session")
def admin_session_cookie() -> str:
    return demo_session_cookie("admin@demo.com")


@pytest.fixture(scope="session")
def faculty_session_cookie() -> str:
    return demo_session_cookie("faculty@demo.com")

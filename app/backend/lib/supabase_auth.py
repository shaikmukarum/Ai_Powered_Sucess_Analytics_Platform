"""Supabase token verification and signed HttpOnly application sessions."""

import os
from datetime import timedelta
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException, Request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

load_dotenv(Path(__file__).parent.parent / ".env")

SESSION_COOKIE = "success_copilot_session"
_signer = URLSafeTimedSerializer(os.environ.get("SESSION_SECRET", "local-dev-session-secret"))


async def verify_supabase_token(access_token: str) -> dict:
    url = f"{os.environ['SUPABASE_URL'].rstrip('/')}/auth/v1/user"
    headers = {"Authorization": f"Bearer {access_token}", "apikey": os.environ["SUPABASE_ANON_KEY"]}
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(url, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Supabase Auth is unavailable") from exc
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Supabase session")
    return response.json()


def make_session(user_id: str, email: str) -> str:
    return _signer.dumps({"sub": user_id, "email": email})


def read_session(request: Request) -> dict:
    raw = request.cookies.get(SESSION_COOKIE)
    if not raw:
        raise HTTPException(status_code=401, detail="Not signed in")
    try:
        return _signer.loads(raw, max_age=int(timedelta(hours=8).total_seconds()))
    except (BadSignature, SignatureExpired) as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc
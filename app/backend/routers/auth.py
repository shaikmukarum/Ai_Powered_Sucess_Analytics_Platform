import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lib.postgres import get_db
from lib.supabase_auth import SESSION_COOKIE, make_session, read_session, verify_supabase_token
from models.auth import AuthUser, SessionTokenIn
from models.supabase import UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])


async def resolve_profile(db: AsyncSession, user_id: str, email: str) -> UserProfile:
    admin_emails = {item.strip().lower() for item in os.environ.get("ADMIN_EMAILS", "").split(",") if item.strip()}
    is_admin = email.lower() in admin_emails
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile:
        if is_admin and (profile.role.lower() != "admin" or profile.department != "All departments"):
            profile.role, profile.department = "Admin", "All departments"
            await db.commit()
        return profile
    profile = UserProfile(user_id=user_id, email=email, role="Admin" if is_admin else "Faculty", department="All departments" if is_admin else "CSE")
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def require_access(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    session = read_session(request)
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == session["sub"]))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=403, detail="Profile is not configured")
    return {"session": session, "profile": profile}


@router.post("/session", response_model=AuthUser)
async def create_session(body: SessionTokenIn, response: Response, db: AsyncSession = Depends(get_db)):
    supabase_user = await verify_supabase_token(body.access_token)
    email = str(supabase_user.get("email", ""))
    profile = await resolve_profile(db, str(supabase_user["id"]), email)
    response.set_cookie(SESSION_COOKIE, make_session(str(supabase_user["id"]), email), httponly=True, secure=os.environ.get("COOKIE_SECURE", "1") == "1", samesite="lax", max_age=8 * 60 * 60, path="/")
    return AuthUser(email=profile.email, name=email.split("@")[0].replace(".", " ").title(), role=profile.role.lower(), department=profile.department)


@router.get("/me", response_model=AuthUser)
async def current_user(access: dict = Depends(require_access)):
    profile = access["profile"]
    return AuthUser(email=profile.email, name=profile.email.split("@")[0].replace(".", " ").title(), role=profile.role.lower(), department=profile.department)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, secure=os.environ.get("COOKIE_SECURE", "1") == "1", samesite="lax")
    response.headers["Cache-Control"] = "no-store"
    return {"ok": True}
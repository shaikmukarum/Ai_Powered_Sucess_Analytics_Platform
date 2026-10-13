"""Map the approved Supabase demo identities to application roles, idempotently."""

import asyncio

from sqlalchemy import select, text

from lib.postgres import SessionLocal, engine
from models.supabase import UserProfile

ROLE_MAP = {
    "admin@demo.com": ("Admin", "All departments"),
    "faculty@demo.com": ("Faculty", "CSE"),
}


async def main() -> None:
    if SessionLocal is None or engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with SessionLocal() as db:
        users = await db.execute(text("SELECT id::text, email FROM auth.users WHERE email IN ('admin@demo.com', 'faculty@demo.com')"))
        mapped = 0
        for user_id, email in users.all():
            existing = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
            role, department = ROLE_MAP[email]
            if existing:
                existing.role = role
                existing.department = department
            else:
                db.add(UserProfile(user_id=user_id, email=email, role=role, department=department))
            mapped += 1
        await db.commit()
        print(f"Mapped {mapped} Supabase auth profiles")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
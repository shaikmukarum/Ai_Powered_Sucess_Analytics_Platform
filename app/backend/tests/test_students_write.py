"""In-process tests for POST/PATCH /students on an in-memory SQLite DB (no live server or Supabase needed).

Run: cd backend && pytest tests/test_students_write.py -s
"""

import os, sys, asyncio
from pathlib import Path
os.environ.setdefault("SUPABASE_URL", "http://x"); os.environ.setdefault("SUPABASE_ANON_KEY", "x")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from types import SimpleNamespace
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from lib.postgres import Base, get_db
from lib import scoring
import models.supabase  # noqa
from routers import students as sr
from routers.auth import require_access

def test_scoring_matches_seed():
    import seed_supabase as seed
    for i in range(300):
        r = seed.build_student(i)
        d = scoring.evaluate(r.cgpa, r.attendance, r.lms, r.skills, r.placement, r.engagement)
        assert (d["success_score"], d["academic_risk"], d["placement_risk"], d["segment"]) == (r.success_score, r.academic_risk, r.placement_risk, r.segment)

async def run():
    eng = create_async_engine("sqlite+aiosqlite://")
    async with eng.begin() as c: await c.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(eng, expire_on_commit=False)
    app = FastAPI(); app.include_router(sr.router, prefix="/api")
    async def db():
        async with Session() as s: yield s
    role = {"v": SimpleNamespace(role="Admin", department="All departments")}
    app.dependency_overrides[get_db] = db
    app.dependency_overrides[require_access] = lambda: {"profile": role["v"], "session": {}}
    body = dict(name="Priya Nair Rao", rollNo="24CSE901", email="priya@campus.edu", department="CSE", semester=3, cgpa=8.9, attendance=92, lms=85, skills=88, placement=70, engagement=80, backlogs=0)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        r = await c.post("/api/students", json=body); assert r.status_code == 201, r.text
        s = r.json(); print(s["id"], s["successScore"], s["academicRisk"], s["placementRisk"], s["segment"], s["trend"], s["initials"], s["history"])
        assert s["initials"] == "PR" and s["trend"] == "flat" and len(s["history"]) == 1
        assert (await c.post("/api/students", json=body)).status_code == 409
        assert (await c.post("/api/students", json={**body, "rollNo":"X1", "cgpa": 11})).status_code == 422
        assert (await c.post("/api/students", json={**body, "rollNo":"X2", "email": "bad"})).status_code == 422
        # drop attendance & skills in same semester -> trend down vs stored score
        r = await c.patch(f"/api/students/{s['id']}", json={"attendance": 50, "skills": 30, "cgpa": 6.0}); assert r.status_code == 200, r.text
        u = r.json(); print(u["successScore"], u["academicRisk"], u["segment"], u["trend"], u["history"])
        assert u["trend"] == "down" and len(u["history"]) == 1 and u["history"][0]["score"] == u["successScore"]
        # next semester -> new history entry, compares to previous semester
        r = await c.patch(f"/api/students/{s['id']}", json={"semester": 4, "cgpa": 9.0, "attendance": 95, "skills": 90, "lms": 90}); u = r.json()
        print(u["successScore"], u["trend"], u["history"]); assert len(u["history"]) == 2 and u["trend"] == "up"
        assert (await c.patch(f"/api/students/{s['id']}", json={})).status_code == 422
        # faculty scoping
        role["v"] = SimpleNamespace(role="Faculty", department="ECE")
        assert (await c.post("/api/students", json={**body, "rollNo":"Y1"})).status_code == 403
        assert (await c.patch(f"/api/students/{s['id']}", json={"cgpa": 7})).status_code == 404
        assert (await c.get(f"/api/students/{s['id']}")).status_code == 404
        assert (await c.post("/api/students", json={**body, "rollNo":"Y2", "department":"ECE"})).status_code == 201
    print("ALL OK")

def test_endpoints(): asyncio.run(run())

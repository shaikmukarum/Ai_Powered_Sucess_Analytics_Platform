from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lib.postgres import get_db
from models.student import RiskSignalOut, RiskSignalsResponse
from models.supabase import StudentRecord
from routers.auth import require_access

router = APIRouter(tags=["risk-signals"])


@router.get("/risk-signals", response_model=RiskSignalsResponse)
async def risk_signals(access: dict = Depends(require_access), db: AsyncSession = Depends(get_db)):
    query = select(StudentRecord).order_by(StudentRecord.success_score.asc())
    profile = access["profile"]
    if profile.role.lower() == "faculty":
        query = query.where(StudentRecord.department == profile.department)
    result = await db.execute(query)
    records = result.scalars().all()
    return RiskSignalsResponse(source="supabase", assessedAt=datetime.now(timezone.utc), signals=[RiskSignalOut(id=item.id, name=item.name, department=item.department, semester=item.semester, academicRisk=item.academic_risk, placementRisk=item.placement_risk, successScore=item.success_score, attendance=item.attendance, cgpa=item.cgpa, placement=item.placement, skills=item.skills, history=item.history) for item in records])
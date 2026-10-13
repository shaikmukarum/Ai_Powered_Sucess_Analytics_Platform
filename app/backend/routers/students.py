from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from lib import scoring
from lib.postgres import get_db
from models.student import StudentCreate, StudentMetricsUpdate, StudentOut
from models.supabase import RiskAssessment, StudentRecord
from routers.auth import require_access

router = APIRouter(tags=["students"])


def to_student(record: StudentRecord) -> StudentOut:
    return StudentOut(id=record.id, name=record.name, rollNo=record.roll_no, email=record.email, department=record.department, section=record.section, semester=record.semester, initials=record.initials, cgpa=record.cgpa, attendance=record.attendance, lms=record.lms, skills=record.skills, placement=record.placement, engagement=record.engagement, backlogs=record.backlogs, successScore=record.success_score, academicRisk=record.academic_risk, placementRisk=record.placement_risk, segment=record.segment, trend=record.trend, history=record.history, subjects=record.subjects, facultyFeedback=record.faculty_feedback, studentFeedback=record.student_feedback)


def scoped_query(access: dict):
    query = select(StudentRecord).order_by(StudentRecord.success_score.asc())
    profile = access["profile"]
    if profile.role.lower() == "faculty":
        query = query.where(StudentRecord.department == profile.department)
    return query


def ensure_department_access(access: dict, department: str) -> None:
    """Admins can manage every department; faculty only their own."""
    profile = access["profile"]
    if profile.role.lower() == "faculty" and profile.department != department:
        raise HTTPException(status_code=403, detail=f"You can only manage students in {profile.department}")


def add_risk_assessments(db: AsyncSession, record: StudentRecord, academic_score: float, placement_score: float) -> None:
    db.add(RiskAssessment(student_id=record.id, assessment_type="academic", risk_level=record.academic_risk, risk_score=round(academic_score, 1), factors=["attendance", "cgpa"]))
    db.add(RiskAssessment(student_id=record.id, assessment_type="placement", risk_level=record.placement_risk, risk_score=round(placement_score, 1), factors=["skills", "placement", "engagement"]))


@router.get("/students", response_model=list[StudentOut])
async def list_students(access: dict = Depends(require_access), db: AsyncSession = Depends(get_db)):
    result = await db.execute(scoped_query(access))
    return [to_student(record) for record in result.scalars().all()]


@router.get("/students/{student_id}", response_model=StudentOut)
async def get_student(student_id: str, access: dict = Depends(require_access), db: AsyncSession = Depends(get_db)):
    query = select(StudentRecord).where(StudentRecord.id == student_id)
    profile = access["profile"]
    if profile.role.lower() == "faculty":
        query = query.where(StudentRecord.department == profile.department)
    result = await db.execute(query)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Student not found")
    return to_student(record)


@router.post("/students", response_model=StudentOut, status_code=201)
async def create_student(body: StudentCreate, access: dict = Depends(require_access), db: AsyncSession = Depends(get_db)):
    ensure_department_access(access, body.department)
    if await db.scalar(select(StudentRecord.id).where(StudentRecord.roll_no == body.rollNo)):
        raise HTTPException(status_code=409, detail=f"Roll number {body.rollNo} already exists")

    derived = scoring.evaluate(body.cgpa, body.attendance, body.lms, body.skills, body.placement, body.engagement)
    score = derived["success_score"]
    faculty_default, student_default = scoring.default_feedback(body.attendance, score)
    record = StudentRecord(
        id=f"stu-{uuid4().hex[:8]}",
        name=body.name,
        roll_no=body.rollNo,
        email=body.email,
        department=body.department,
        section=body.section,
        semester=body.semester,
        initials=scoring.initials_for(body.name),
        cgpa=body.cgpa,
        attendance=body.attendance,
        lms=body.lms,
        skills=body.skills,
        placement=body.placement,
        engagement=body.engagement,
        backlogs=body.backlogs,
        success_score=score,
        academic_risk=derived["academic_risk"],
        placement_risk=derived["placement_risk"],
        segment=derived["segment"],
        trend="flat",  # no earlier data point to compare against yet
        history=scoring.upsert_history([], body.semester, body.cgpa, body.attendance, score),
        subjects=scoring.default_subjects(score),
        faculty_feedback=body.facultyFeedback or faculty_default,
        student_feedback=body.studentFeedback or student_default,
    )
    db.add(record)
    add_risk_assessments(db, record, derived["academic_risk_score"], derived["placement_risk_score"])
    await db.commit()
    return to_student(record)


@router.patch("/students/{student_id}", response_model=StudentOut)
async def update_student_metrics(student_id: str, body: StudentMetricsUpdate, access: dict = Depends(require_access), db: AsyncSession = Depends(get_db)):
    record = (await db.execute(select(StudentRecord).where(StudentRecord.id == student_id))).scalar_one_or_none()
    # 404 (not 403) for other departments so faculty can't probe for IDs outside their scope.
    profile = access["profile"]
    if not record or (profile.role.lower() == "faculty" and record.department != profile.department):
        raise HTTPException(status_code=404, detail="Student not found")

    changes = body.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Provide at least one field to update")

    previous_score = record.success_score
    record.semester = changes.get("semester", record.semester)
    for field in ("cgpa", "attendance", "lms", "skills", "placement", "engagement", "backlogs"):
        if field in changes:
            setattr(record, field, changes[field])
    if "facultyFeedback" in changes:
        record.faculty_feedback = changes["facultyFeedback"]
    if "studentFeedback" in changes:
        record.student_feedback = changes["studentFeedback"]

    derived = scoring.evaluate(record.cgpa, record.attendance, record.lms, record.skills, record.placement, record.engagement)
    record.success_score = derived["success_score"]
    record.academic_risk = derived["academic_risk"]
    record.placement_risk = derived["placement_risk"]
    record.segment = derived["segment"]
    # Assign a new list (not in-place mutation) so SQLAlchemy detects the JSON column change.
    record.history = scoring.upsert_history(record.history, record.semester, record.cgpa, record.attendance, record.success_score)
    record.trend = scoring.real_trend(record.history, record.semester, record.success_score, previous_score)
    add_risk_assessments(db, record, derived["academic_risk_score"], derived["placement_risk_score"])
    await db.commit()
    return to_student(record)

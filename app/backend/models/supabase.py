"""SQLAlchemy models persisted in Supabase PostgreSQL."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from lib.postgres import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserProfile(Base):
    __tablename__ = "user_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_profiles_user_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    role: Mapped[str] = mapped_column(String(32), default="Faculty")
    department: Mapped[str] = mapped_column(String(32), default="CSE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class StudentRecord(Base):
    __tablename__ = "students"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    roll_no: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(32), index=True)
    section: Mapped[str] = mapped_column(String(8), default="A", server_default="A", index=True)
    semester: Mapped[int] = mapped_column(Integer, index=True)
    initials: Mapped[str] = mapped_column(String(8))
    cgpa: Mapped[float] = mapped_column(Float)
    attendance: Mapped[int] = mapped_column(Integer)
    lms: Mapped[int] = mapped_column(Integer)
    skills: Mapped[int] = mapped_column(Integer)
    placement: Mapped[int] = mapped_column(Integer)
    engagement: Mapped[int] = mapped_column(Integer)
    backlogs: Mapped[int] = mapped_column(Integer)
    success_score: Mapped[int] = mapped_column(Integer, index=True)
    academic_risk: Mapped[str] = mapped_column(String(16), index=True)
    placement_risk: Mapped[str] = mapped_column(String(16), index=True)
    segment: Mapped[str] = mapped_column(String(64), index=True)
    trend: Mapped[str] = mapped_column(String(16))
    history: Mapped[list] = mapped_column(JSON)
    subjects: Mapped[list] = mapped_column(JSON)
    faculty_feedback: Mapped[str] = mapped_column(Text)
    student_feedback: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    student_id: Mapped[str] = mapped_column(String(64), index=True)
    assessment_type: Mapped[str] = mapped_column(String(32), index=True)
    risk_level: Mapped[str] = mapped_column(String(16), index=True)
    risk_score: Mapped[float] = mapped_column(Float)
    factors: Mapped[list] = mapped_column(JSON)
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
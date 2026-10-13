from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    rollNo: str
    email: str
    department: str
    section: str = "A"
    semester: int
    initials: str
    cgpa: float
    attendance: int
    lms: int
    skills: int
    placement: int
    engagement: int
    backlogs: int
    successScore: int
    academicRisk: str
    placementRisk: str
    segment: str
    trend: str
    history: list[dict]
    subjects: list[dict]
    facultyFeedback: str
    studentFeedback: str


class RiskSignalOut(BaseModel):
    id: str
    name: str
    department: str
    semester: int
    academicRisk: str
    placementRisk: str
    successScore: int
    attendance: int
    cgpa: float
    placement: int
    skills: int
    history: list[dict]


class RiskSignalsResponse(BaseModel):
    source: str
    signals: list[RiskSignalOut]
    assessedAt: datetime


Department = Literal["CSE", "ECE", "MECH", "CIVIL", "IT"]


class StudentCreate(BaseModel):
    """Only the essentials. Score, risk, segment, trend and history are calculated server-side."""

    name: str = Field(min_length=2, max_length=200)
    rollNo: str = Field(min_length=2, max_length=64)
    email: str = Field(max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    department: Department
    section: str = Field(default="A", pattern=r"^[A-Za-z0-9]{1,8}$")
    semester: int = Field(ge=1, le=8)
    cgpa: float = Field(ge=0, le=10)
    attendance: int = Field(ge=0, le=100)
    lms: int = Field(ge=0, le=100)
    skills: int = Field(ge=0, le=100)
    placement: int = Field(ge=0, le=100)
    engagement: int = Field(ge=0, le=100)
    backlogs: int = Field(default=0, ge=0, le=50)
    facultyFeedback: str | None = Field(default=None, max_length=2000)
    studentFeedback: str | None = Field(default=None, max_length=2000)

    @field_validator("name", "rollNo", "email")
    @classmethod
    def strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("section")
    @classmethod
    def upper_section(cls, value: str) -> str:
        return value.upper()


class StudentMetricsUpdate(BaseModel):
    """Partial update of the measured metrics; everything derived is recalculated."""

    semester: int | None = Field(default=None, ge=1, le=8)
    cgpa: float | None = Field(default=None, ge=0, le=10)
    attendance: int | None = Field(default=None, ge=0, le=100)
    lms: int | None = Field(default=None, ge=0, le=100)
    skills: int | None = Field(default=None, ge=0, le=100)
    placement: int | None = Field(default=None, ge=0, le=100)
    engagement: int | None = Field(default=None, ge=0, le=100)
    backlogs: int | None = Field(default=None, ge=0, le=50)
    facultyFeedback: str | None = Field(default=None, max_length=2000)
    studentFeedback: str | None = Field(default=None, max_length=2000)

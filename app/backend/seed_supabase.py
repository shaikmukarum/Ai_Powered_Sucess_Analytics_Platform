"""Idempotently seed the Supabase student/risk tables with 300 demo profiles."""

import asyncio
import math
from pathlib import Path
import sys

from sqlalchemy import func, select

sys.path.insert(0, str(Path(__file__).parent))
from lib import scoring
from lib.postgres import SessionLocal, engine
from models.supabase import RiskAssessment, StudentRecord

departments = ["CSE", "ECE", "MECH", "CIVIL", "IT"]
first_names = ["Aarav", "Aanya", "Aditya", "Anika", "Arjun", "Avni", "Dev", "Diya", "Ishaan", "Ira", "Kabir", "Kiara", "Krish", "Meera", "Nikhil", "Nisha", "Rohan", "Riya", "Saanvi", "Samarth", "Shreya", "Tanay", "Tara", "Ved", "Vikram", "Yash", "Zoya", "Aditi", "Karan", "Maya"]
last_names = ["Mehta", "Shah", "Iyer", "Patel", "Rao", "Nair", "Kapoor", "Bose", "Malhotra", "Joshi", "Desai", "Kulkarni", "Menon", "Bhat", "Saxena", "Chopra", "Sethi", "Pillai", "Ghosh", "Singh"]


def wave(index: int, seed: int) -> float:
    return math.sin(index * 1.37 + seed * 0.71) * 0.5 + 0.5


def build_student(index: int) -> StudentRecord:
    department = departments[index % len(departments)]
    semester = index % 8 + 1
    first = first_names[index % len(first_names)]
    last = last_names[(index * 3) % len(last_names)]
    name = f"{first} {last}"
    cgpa = round(max(5.3, min(9.8, 6.7 + wave(index, 2) * 2.45 + (0.18 if semester > 5 else 0))), 1)
    attendance = round(max(48, min(98, 62 + wave(index, 3) * 35 - (9 if index % 17 == 0 else 0))))
    lms = round(max(28, min(99, 48 + wave(index, 4) * 48)))
    skills = round(max(24, min(98, 42 + wave(index, 5) * 52)))
    placement = round(max(20, min(99, 38 + wave(index, 6) * 56 + (8 if semester >= 6 else 0))))
    engagement = round(max(20, min(99, 38 + wave(index, 7) * 58)))
    backlogs = max(0, round((8.2 - cgpa) * 1.3) + (1 if attendance < 70 else 0))
    derived = scoring.evaluate(cgpa, attendance, lms, skills, placement, engagement)
    success = derived["success_score"]
    academic_risk = derived["academic_risk"]
    placement_risk = derived["placement_risk"]
    segment = derived["segment"]
    history = [{"semester": item + 1, "cgpa": round(max(5, min(9.9, cgpa - (7 - item) * 0.16 + wave(index + item, 1) * 0.16)), 1), "attendance": round(max(48, min(99, attendance - (7 - item) * 1.6 + wave(index + item, 8) * 3))), "score": round(max(20, min(99, success - (7 - item) * 2 + wave(index + item, 9) * 3)))} for item in range(8)]
    subjects = [{"name": subject, "score": round(max(42, min(99, success + wave(index + subject_index, 10) * 18 - 9)))} for subject_index, subject in enumerate(["Data Structures", "Operating Systems", "Computer Networks", "Applied Maths"])]
    return StudentRecord(id=f"stu-{index + 1:03d}", name=name, roll_no=f"24{department}{index + 1:03d}", email=f"{first.lower()}.{last.lower()}{index + 1}@campus.edu", department=department, semester=semester, initials=f"{first[0]}{last[0]}", cgpa=cgpa, attendance=attendance, lms=lms, skills=skills, placement=placement, engagement=engagement, backlogs=backlogs, success_score=success, academic_risk=academic_risk, placement_risk=placement_risk, segment=segment, trend="up" if success > 74 else "down" if success < 52 else "flat", history=history, subjects=subjects, faculty_feedback="Consistent contributor in peer reviews; ready for a stretch project." if success > 70 else "Shows promise, but benefits from a weekly check-in and clearer study cadence.", student_feedback="I want more flexibility around commute and lab timings." if attendance < 75 else "I feel confident about my current semester goals.")


async def main() -> None:
    if SessionLocal is None or engine is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count()).select_from(StudentRecord))
        if count and count >= 300:
            print("Supabase seed already contains 300+ students")
            return
        students = [build_student(index) for index in range(300)]
        db.add_all(students)
        await db.flush()
        for student in students:
            db.add(RiskAssessment(student_id=student.id, assessment_type="academic", risk_level=student.academic_risk, risk_score=round(scoring.academic_risk_score(student.cgpa, student.attendance), 1), factors=["attendance", "cgpa"]))
            db.add(RiskAssessment(student_id=student.id, assessment_type="placement", risk_level=student.placement_risk, risk_score=round(scoring.placement_risk_score(student.skills, student.placement, student.engagement), 1), factors=["skills", "placement", "engagement"]))
        await db.commit()
        print("Seeded 300 Supabase students and risk assessments")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
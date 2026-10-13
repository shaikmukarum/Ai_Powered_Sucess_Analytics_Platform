"""Single source of truth for student scoring, risk levels, segments and trends.

Used by the seed script and by the POST/PATCH /students endpoints so a student
added through the app is scored exactly like the 300 seeded demo students.
"""

from __future__ import annotations

from typing import Any

DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "IT"]

# Weights must match frontend/src/lib/scoring.ts -> defaultWeights (sum = 100).
SCORE_WEIGHTS = {"cgpa": 25, "attendance": 20, "lms": 15, "skills": 15, "placement": 15, "engagement": 10}

DEFAULT_SUBJECTS = ["Data Structures", "Operating Systems", "Computer Networks", "Applied Maths"]

TREND_DELTA = 2  # score must move by at least this many points to count as up/down


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def risk_level(score: float) -> str:
    """High below 45, Medium 45-70, Low above 70."""
    return "High" if score < 45 else "Medium" if score <= 70 else "Low"


def success_score(cgpa: float, attendance: float, lms: float, skills: float, placement: float, engagement: float) -> int:
    w = SCORE_WEIGHTS
    return round(
        cgpa / 10 * w["cgpa"]
        + attendance / 100 * w["attendance"]
        + lms / 100 * w["lms"]
        + skills / 100 * w["skills"]
        + placement / 100 * w["placement"]
        + engagement / 100 * w["engagement"]
    )


def academic_risk_score(cgpa: float, attendance: float) -> float:
    return cgpa / 10 * 55 + attendance / 100 * 45


def placement_risk_score(skills: float, placement: float, engagement: float) -> float:
    return skills * 0.42 + placement * 0.38 + engagement * 0.2


def segment_for(score: int, cgpa: float, attendance: float, skills: float, placement: float) -> str:
    if score >= 82 and placement >= 80:
        return "Placement Ready"
    if cgpa >= 8.7 and skills >= 75:
        return "Academic Stars"
    if attendance < 75:
        return "Low Attendance"
    if cgpa >= 8.4 and skills < 62:
        return "High CGPA · Low Skills"
    if score < 55:
        return "At Risk"
    return "Well-Rounded"


def initials_for(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return f"{parts[0][0]}{parts[-1][0]}".upper()


def trend_from_delta(delta: float) -> str:
    return "up" if delta >= TREND_DELTA else "down" if delta <= -TREND_DELTA else "flat"


def evaluate(cgpa: float, attendance: float, lms: float, skills: float, placement: float, engagement: float) -> dict[str, Any]:
    """Everything derived from the six core metrics."""
    score = success_score(cgpa, attendance, lms, skills, placement, engagement)
    academic = academic_risk_score(cgpa, attendance)
    placement_risk = placement_risk_score(skills, placement, engagement)
    return {
        "success_score": score,
        "academic_risk_score": academic,
        "placement_risk_score": placement_risk,
        "academic_risk": risk_level(academic),
        "placement_risk": risk_level(placement_risk),
        "segment": segment_for(score, cgpa, attendance, skills, placement),
    }


def upsert_history(history: list[dict] | None, semester: int, cgpa: float, attendance: float, score: int) -> list[dict]:
    """Add (or replace) the entry for `semester`, keeping the list ordered by semester."""
    entries = [dict(item) for item in (history or []) if item.get("semester") != semester]
    entries.append({"semester": semester, "cgpa": round(cgpa, 1), "attendance": round(attendance), "score": score})
    return sorted(entries, key=lambda item: item["semester"])


def real_trend(history: list[dict], semester: int, score: int, previous_score: int | None) -> str:
    """Trend from actual data: compare against the previous semester entry, else the previously stored score."""
    earlier = [item for item in history if item["semester"] < semester]
    baseline = earlier[-1]["score"] if earlier else previous_score
    return "flat" if baseline is None else trend_from_delta(score - baseline)


def default_subjects(score: int) -> list[dict]:
    """Placeholder subject scores until real marks are entered (centered on the success score)."""
    return [{"name": name, "score": round(clamp(score, 42, 99))} for name in DEFAULT_SUBJECTS]


def default_feedback(attendance: float, score: int) -> tuple[str, str]:
    faculty = (
        "Consistent contributor in peer reviews; ready for a stretch project."
        if score > 70
        else "Shows promise, but benefits from a weekly check-in and clearer study cadence."
    )
    student = "I want more flexibility around commute and lab timings." if attendance < 75 else "I feel confident about my current semester goals."
    return faculty, student

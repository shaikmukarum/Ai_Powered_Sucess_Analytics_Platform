import type { RiskLevel, Student } from "@/types/student";

export function riskTone(risk: RiskLevel): string {
  return risk === "High"
    ? "border-rose-300/25 bg-rose-300/10 text-rose-200"
    : risk === "Medium"
      ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
      : "border-emerald-300/25 bg-emerald-300/10 text-emerald-200";
}

export function riskColor(risk: RiskLevel): string {
  return risk === "High" ? "#FB7185" : risk === "Medium" ? "#FBBF24" : "#4ADE80";
}

export function getRiskReason(student: Student): string {
  if (student.attendance < 75) return `Attendance is ${student.attendance}%, below the 75% support threshold.`;
  if (student.skills < 55) return "Skill signals are trailing the cohort, reducing placement confidence.";
  if (student.cgpa < 7) return "Recent academic performance suggests a need for structured mentoring.";
  return "The model sees a balanced profile with no single dominant risk driver.";
}
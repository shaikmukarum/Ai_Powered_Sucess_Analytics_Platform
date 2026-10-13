import type { Student } from "@/types/student";

export interface ScoreWeights {
  cgpa: number;
  attendance: number;
  lms: number;
  skills: number;
  placement: number;
  engagement: number;
}

export const defaultWeights: ScoreWeights = {
  cgpa: 25,
  attendance: 20,
  lms: 15,
  skills: 15,
  placement: 15,
  engagement: 10,
};

export function scoreWithWeights(student: Student, weights: ScoreWeights): number {
  return Math.round(
    student.cgpa / 10 * weights.cgpa +
    student.attendance / 100 * weights.attendance +
    student.lms / 100 * weights.lms +
    student.skills / 100 * weights.skills +
    student.placement / 100 * weights.placement +
    student.engagement / 100 * weights.engagement,
  );
}

export const scoreFactors = (student: Student) => [
  { key: "cgpa", label: "CGPA", value: student.cgpa / 10 * 100, color: "#C4B5FD" },
  { key: "attendance", label: "Attendance", value: student.attendance, color: "#67E8F9" },
  { key: "lms", label: "LMS activity", value: student.lms, color: "#A78BFA" },
  { key: "skills", label: "Skills", value: student.skills, color: "#4ADE80" },
  { key: "placement", label: "Placement", value: student.placement, color: "#FBBF24" },
  { key: "engagement", label: "Engagement", value: student.engagement, color: "#FB7185" },
];
// ---- Live preview of what the backend will calculate on save (mirror of backend/lib/scoring.py) ----
import type { RiskLevel, Segment } from "@/types/student";

export interface CoreMetrics {
  cgpa: number;
  attendance: number;
  lms: number;
  skills: number;
  placement: number;
  engagement: number;
}

const riskFor = (score: number): RiskLevel => (score < 45 ? "High" : score <= 70 ? "Medium" : "Low");

export function evaluateMetrics(m: CoreMetrics): { successScore: number; academicRisk: RiskLevel; placementRisk: RiskLevel; segment: Segment } {
  const successScore = Math.round(
    m.cgpa / 10 * defaultWeights.cgpa + m.attendance / 100 * defaultWeights.attendance + m.lms / 100 * defaultWeights.lms +
    m.skills / 100 * defaultWeights.skills + m.placement / 100 * defaultWeights.placement + m.engagement / 100 * defaultWeights.engagement,
  );
  const academicRisk = riskFor(m.cgpa / 10 * 55 + m.attendance / 100 * 45);
  const placementRisk = riskFor(m.skills * 0.42 + m.placement * 0.38 + m.engagement * 0.2);
  const segment: Segment =
    successScore >= 82 && m.placement >= 80 ? "Placement Ready"
    : m.cgpa >= 8.7 && m.skills >= 75 ? "Academic Stars"
    : m.attendance < 75 ? "Low Attendance"
    : m.cgpa >= 8.4 && m.skills < 62 ? "High CGPA · Low Skills"
    : successScore < 55 ? "At Risk"
    : "Well-Rounded";
  return { successScore, academicRisk, placementRisk, segment };
}

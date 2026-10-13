export type Role = "admin" | "faculty" | "principal";
export type RiskLevel = "High" | "Medium" | "Low";
export type Segment =
  | "Placement Ready"
  | "Academic Stars"
  | "At Risk"
  | "Low Attendance"
  | "High CGPA · Low Skills"
  | "Well-Rounded";

export interface SemesterRecord {
  semester: number;
  cgpa: number;
  attendance: number;
  score: number;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  section: string;
  semester: number;
  initials: string;
  cgpa: number;
  attendance: number;
  lms: number;
  skills: number;
  placement: number;
  engagement: number;
  backlogs: number;
  successScore: number;
  academicRisk: RiskLevel;
  placementRisk: RiskLevel;
  segment: Segment;
  trend: "up" | "down" | "flat";
  history: SemesterRecord[];
  subjects: { name: string; score: number }[];
  facultyFeedback: string;
  studentFeedback: string;
}

export const departments = ["CSE", "ECE", "MECH", "CIVIL", "IT"] as const;
export const sections = ["A", "B", "C"] as const;
export const semesters = [1, 2, 3, 4, 5, 6, 7, 8] as const;

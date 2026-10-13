export type Role = "admin" | "faculty";
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
export const semesters = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const firstNames = [
  "Aarav", "Aanya", "Aditya", "Anika", "Arjun", "Avni", "Dev", "Diya", "Ishaan", "Ira",
  "Kabir", "Kiara", "Krish", "Meera", "Nikhil", "Nisha", "Rohan", "Riya", "Saanvi", "Samarth",
  "Shreya", "Tanay", "Tara", "Ved", "Vikram", "Yash", "Zoya", "Aditi", "Karan", "Maya",
];
const lastNames = [
  "Mehta", "Shah", "Iyer", "Patel", "Rao", "Nair", "Kapoor", "Bose", "Malhotra", "Joshi",
  "Desai", "Kulkarni", "Menon", "Bhat", "Saxena", "Chopra", "Sethi", "Pillai", "Ghosh", "Singh",
];
const subjectNames = ["Data Structures", "Operating Systems", "Computer Networks", "Applied Maths"];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const wave = (index: number, seed: number) => Math.sin(index * 1.37 + seed * 0.71) * 0.5 + 0.5;

const riskFor = (score: number): RiskLevel => (score < 45 ? "High" : score <= 70 ? "Medium" : "Low");

const segmentFor = (student: Omit<Student, "segment">): Segment => {
  if (student.successScore >= 82 && student.placement >= 80) return "Placement Ready";
  if (student.cgpa >= 8.7 && student.skills >= 75) return "Academic Stars";
  if (student.attendance < 75) return "Low Attendance";
  if (student.cgpa >= 8.4 && student.skills < 62) return "High CGPA · Low Skills";
  if (student.successScore < 55) return "At Risk";
  return "Well-Rounded";
};

export function createMockStudents(count = 300): Student[] {
  return Array.from({ length: count }, (_, index) => {
    const department = departments[index % departments.length];
    const semester = (index % 8) + 1;
    const academicBase = 6.7 + wave(index, 2) * 2.45;
    const attendance = clamp(62 + wave(index, 3) * 35 - (index % 17 === 0 ? 9 : 0), 48, 98);
    const cgpa = Number(clamp(academicBase + (semester > 5 ? 0.18 : 0), 5.3, 9.8).toFixed(1));
    const lms = Number(clamp(48 + wave(index, 4) * 48, 28, 99).toFixed(0));
    const skills = Number(clamp(42 + wave(index, 5) * 52, 24, 98).toFixed(0));
    const placement = Number(clamp(38 + wave(index, 6) * 56 + (semester >= 6 ? 8 : 0), 20, 99).toFixed(0));
    const engagement = Number(clamp(38 + wave(index, 7) * 58, 20, 99).toFixed(0));
    const backlogs = Math.max(0, Math.round((8.2 - cgpa) * 1.3) + (attendance < 70 ? 1 : 0));
    const successScore = Math.round(
      cgpa / 10 * 25 +
      attendance / 100 * 20 +
      lms / 100 * 15 +
      skills / 100 * 15 +
      placement / 100 * 15 +
      engagement / 100 * 10,
    );
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[(index * 3) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`;
    const academicRisk = riskFor(Math.round(cgpa / 10 * 55 + attendance / 100 * 45));
    const placementRisk = riskFor(Math.round(skills * 0.42 + placement * 0.38 + engagement * 0.2));
    const trend = successScore > 74 ? "up" : successScore < 52 ? "down" : "flat";
    const history = Array.from({ length: 8 }, (_, historyIndex) => ({
      semester: historyIndex + 1,
      cgpa: Number(clamp(cgpa - (7 - historyIndex) * 0.16 + wave(index + historyIndex, 1) * 0.16, 5, 9.9).toFixed(1)),
      attendance: Math.round(clamp(attendance - (7 - historyIndex) * 1.6 + wave(index + historyIndex, 8) * 3, 48, 99)),
      score: Math.round(clamp(successScore - (7 - historyIndex) * 2 + wave(index + historyIndex, 9) * 3, 20, 99)),
    }));
    const baseStudent = {
      id: `stu-${String(index + 1).padStart(3, "0")}`,
      name,
      rollNo: `24${department}${String(index + 1).padStart(3, "0")}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@campus.edu`,
      department,
      semester,
      initials,
      cgpa,
      attendance: Math.round(attendance),
      lms,
      skills,
      placement,
      engagement,
      backlogs,
      successScore,
      academicRisk,
      placementRisk,
      trend: trend as Student["trend"],
      history,
      subjects: subjectNames.map((subject, subjectIndex) => ({
        name: subject,
        score: Math.round(clamp(successScore + wave(index + subjectIndex, 10) * 18 - 9, 42, 99)),
      })),
      facultyFeedback: successScore > 70
        ? "Consistent contributor in peer reviews; ready for a stretch project."
        : "Shows promise, but benefits from a weekly check-in and clearer study cadence.",
      studentFeedback: attendance < 75
        ? "I want more flexibility around commute and lab timings."
        : "I feel confident about my current semester goals.",
    } satisfies Omit<Student, "segment">;
    return { ...baseStudent, segment: segmentFor(baseStudent) };
  });
}

export const mockStudents = createMockStudents();

export function getStudentsForRole(role: Role): Student[] {
  return role === "faculty" ? mockStudents.filter((student) => student.department === "CSE") : mockStudents;
}

export function getStudentById(id: string | undefined): Student | undefined {
  return mockStudents.find((student) => student.id === id);
}

export const demoUsers = {
  admin: { email: "admin@demo.com", name: "Dr. Ananya Rao", role: "admin" as const, department: "All departments" },
  faculty: { email: "faculty@demo.com", name: "Prof. Vikram Shah", role: "faculty" as const, department: "CSE" },
};
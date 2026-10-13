import type { Student } from "@/types/student";

export interface Recommendation {
  title: string;
  description: string;
  impact: number;
  icon: "attendance" | "skills" | "academic" | "placement";
}

export function generateRecommendations(student: Student): Recommendation[] {
  const recommendations: Recommendation[] = [];
  if (student.attendance < 80) recommendations.push({ title: "Restore attendance rhythm", description: "Set a two-week attendance goal and pair it with a faculty check-in.", impact: 5, icon: "attendance" });
  if (student.skills < 70) recommendations.push({ title: "Build coding fluency", description: "Complete two guided practice sets each week using the placement lab track.", impact: 8, icon: "skills" });
  if (student.cgpa < 7.6 || student.backlogs > 0) recommendations.push({ title: "Create an academic recovery plan", description: "Break the weakest subject into weekly revision milestones and peer support.", impact: 6, icon: "academic" });
  if (student.placement < 72) recommendations.push({ title: "Prepare for placement readiness", description: "Schedule a mock interview and one aptitude sprint before the next review.", impact: 7, icon: "placement" });
  return recommendations.slice(0, 3);
}
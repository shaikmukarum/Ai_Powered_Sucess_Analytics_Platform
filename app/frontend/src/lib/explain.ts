import type { Student } from "@/types/student";
import { defaultWeights, scoreFactors } from "@/lib/scoring";

export interface ExplanationFactor {
  label: string;
  value: number;
  contribution: number;
  positive: boolean;
  color: string;
}

export function explainStudent(student: Student): { positive: ExplanationFactor[]; negative: ExplanationFactor[]; all: ExplanationFactor[] } {
  const cohortAverage = { cgpa: 7.8, attendance: 82, lms: 73, skills: 70, placement: 68, engagement: 71 };
  const factors = scoreFactors(student).map((factor) => {
    const key = factor.key as keyof typeof cohortAverage;
    const delta = factor.value - cohortAverage[key];
    const contribution = Number((Math.abs(delta) * (defaultWeights[key] / 100) / 10).toFixed(1));
    return { ...factor, contribution, positive: delta >= 0 };
  });
  return {
    positive: factors.filter((factor) => factor.positive).sort((a, b) => b.contribution - a.contribution).slice(0, 3),
    negative: factors.filter((factor) => !factor.positive).sort((a, b) => b.contribution - a.contribution).slice(0, 3),
    all: factors,
  };
}
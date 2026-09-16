import type { EnglishLevel, SkillScore } from "@/lib/types";

export const LEVEL_LABELS: Record<EnglishLevel, string> = {
  a1: "A1 · Beginner",
  a2: "A2 · Elementary",
  b1: "B1 · Intermediate",
  b2: "B2 · Upper Intermediate",
  c1: "C1 · Advanced",
  c2: "C2 · Proficient",
};

export function levelFromPercentage(pct: number): EnglishLevel {
  if (pct < 25) return "a1";
  if (pct < 40) return "a2";
  if (pct < 60) return "b1";
  if (pct < 75) return "b2";
  if (pct < 90) return "c1";
  return "c2";
}

export function confidenceFrom(scores: SkillScore[], expectedSkillCount: number): number {
  const totalQuestions = scores.reduce((s, x) => s + x.total, 0);
  const attempted = scores.filter((s) => s.total > 0).length;
  const base = Math.min(100, 40 + totalQuestions * 4);
  const coverage = expectedSkillCount ? attempted / expectedSkillCount : 1;
  return Math.max(20, Math.round(base * coverage));
}

export function classifySkills(scores: SkillScore[]): {
  strengths: SkillScore["skill"][];
  weaknesses: SkillScore["skill"][];
} {
  const attempted = scores.filter((s) => s.total > 0);
  return {
    strengths: attempted.filter((s) => s.percentage >= 75).map((s) => s.skill),
    weaknesses: attempted.filter((s) => s.percentage < 60).map((s) => s.skill),
  };
}

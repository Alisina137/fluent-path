import type {
  AssessmentAnswer,
  AssessmentQuestion,
  QuestionDifficulty,
  SkillId,
  SkillScore,
} from "@/lib/types";

export const DIFFICULTY_WEIGHT: Record<QuestionDifficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

export function isAnswerCorrect(
  q: AssessmentQuestion,
  value: string | number | boolean | null,
): boolean {
  if (value === null || value === undefined) return false;
  switch (q.type) {
    case "multiple_choice":
    case "synonym":
    case "sentence_correction":
      return typeof value === "number" && value === q.answer_index;
    case "true_false":
      return typeof value === "boolean" && value === q.answer;
    case "fill_blank": {
      if (typeof value !== "string") return false;
      const norm = value.trim().toLowerCase();
      if (!norm) return false;
      const primary = q.answer.trim().toLowerCase();
      if (norm === primary) return true;
      return (q.accepted ?? []).some((a) => a.trim().toLowerCase() === norm);
    }
    case "match": {
      if (typeof value !== "string") return false;
      const parsed = safeParse(value);
      if (!parsed) return false;
      return q.pairs.every((p) => parsed[p.left] === p.right);
    }
  }
}

function safeParse(s: string): Record<string, string> | null {
  try {
    const v = JSON.parse(s);
    return typeof v === "object" && v ? (v as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export function scoreSkill(answers: AssessmentAnswer[], skill: SkillId): SkillScore {
  const items = answers.filter((a) => a.skill === skill);
  const total = items.length;
  const correct = items.filter((a) => a.correct).length;
  const weighted_correct = items
    .filter((a) => a.correct)
    .reduce((sum, a) => sum + DIFFICULTY_WEIGHT[a.difficulty], 0);
  const weighted_total = items.reduce((sum, a) => sum + DIFFICULTY_WEIGHT[a.difficulty], 0);
  const percentage = weighted_total ? Math.round((weighted_correct / weighted_total) * 100) : 0;
  return { skill, correct, total, weighted_correct, weighted_total, percentage };
}

export function scoreAll(
  answers: AssessmentAnswer[],
  skills: SkillId[],
): { scores: SkillScore[]; overall: number } {
  const scores = skills.map((s) => scoreSkill(answers, s));
  const attempted = scores.filter((s) => s.total > 0);
  const weightedCorrect = attempted.reduce((sum, s) => sum + s.weighted_correct, 0);
  const weightedTotal = attempted.reduce((sum, s) => sum + s.weighted_total, 0);
  const overall = weightedTotal ? Math.round((weightedCorrect / weightedTotal) * 100) : 0;
  return { scores, overall };
}

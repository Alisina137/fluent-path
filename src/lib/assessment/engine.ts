import type {
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentQuestion,
  AssessmentResult,
  SkillId,
} from "@/lib/types";
import { questionsForSection } from "./questions";
import { isAnswerCorrect, scoreAll } from "./scoring";
import { classifySkills, confidenceFrom, levelFromPercentage } from "./level";
import { recommendFromScores } from "./recommend";
import { ASSESSMENT_SECTIONS } from "./sections";

export function availableSkills(): SkillId[] {
  return ASSESSMENT_SECTIONS.filter((s) => s.status === "available").map((s) => s.id);
}

export function newAttempt(userId: string, sections: SkillId[]): AssessmentAttempt {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    started_at: new Date().toISOString(),
    completed_at: null,
    duration_ms: 0,
    answers: [],
    section_ids: sections,
  };
}

export function buildQuestionList(sections: SkillId[]): AssessmentQuestion[] {
  return sections.flatMap((s) => questionsForSection(s));
}

export function recordAnswer(
  q: AssessmentQuestion,
  value: string | number | boolean | null,
): AssessmentAnswer {
  return {
    question_id: q.id,
    skill: q.skill,
    difficulty: q.difficulty,
    value,
    correct: isAnswerCorrect(q, value),
  };
}

export function finalizeAttempt(
  attempt: AssessmentAttempt,
  answers: AssessmentAnswer[],
): { attempt: AssessmentAttempt; result: AssessmentResult } {
  const startedAt = new Date(attempt.started_at).getTime();
  const completedAt = new Date();
  const duration_ms = completedAt.getTime() - startedAt;
  const finished: AssessmentAttempt = {
    ...attempt,
    answers,
    completed_at: completedAt.toISOString(),
    duration_ms,
  };
  const { scores, overall } = scoreAll(answers, attempt.section_ids);
  const { strengths, weaknesses } = classifySkills(scores);
  const estimated_level = levelFromPercentage(overall);
  const confidence = confidenceFrom(scores, attempt.section_ids.length);
  const recommended_module_ids = recommendFromScores(scores);
  const result: AssessmentResult = {
    attempt_id: attempt.id,
    completed_at: finished.completed_at!,
    scores,
    overall_percentage: overall,
    estimated_level,
    confidence,
    strengths,
    weaknesses,
    recommended_module_ids,
    duration_ms,
  };
  return { attempt: finished, result };
}

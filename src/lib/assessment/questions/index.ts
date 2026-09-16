import type { AssessmentQuestion, SkillId } from "@/lib/types";
import { VOCABULARY_QUESTIONS } from "./vocabulary";
import { GRAMMAR_QUESTIONS } from "./grammar";
import { READING_QUESTIONS, READING_PASSAGES } from "./reading";
import { LISTENING_QUESTIONS, LISTENING_CLIPS } from "./listening";

export const QUESTION_BANK: Partial<Record<SkillId, AssessmentQuestion[]>> = {
  vocabulary: VOCABULARY_QUESTIONS,
  grammar: GRAMMAR_QUESTIONS,
  reading: READING_QUESTIONS,
  listening: LISTENING_QUESTIONS,
};

export { READING_PASSAGES, LISTENING_CLIPS };

export function questionsForSection(skill: SkillId): AssessmentQuestion[] {
  return QUESTION_BANK[skill] ?? [];
}

export function totalQuestionsForSection(skill: SkillId): number {
  return questionsForSection(skill).length;
}

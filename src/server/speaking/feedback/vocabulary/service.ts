import { evaluateVocabularyWithOpenAi } from "./openai";

import type { VocabularyEvaluationResult } from "./types";

export async function evaluateSpeakingVocabulary(
  text: string,
): Promise<VocabularyEvaluationResult> {
  return evaluateVocabularyWithOpenAi({
    text,
  });
}

import { evaluateGrammarWithOpenAi } from "./openai";
import type { GrammarEvaluationResult } from "./types";

export async function evaluateSpeakingGrammar(text: string): Promise<GrammarEvaluationResult> {
  return evaluateGrammarWithOpenAi({
    text,
  });
}

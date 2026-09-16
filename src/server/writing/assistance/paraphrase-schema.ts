import { z } from "zod";

import { WritingEvaluationError } from "../evaluation/errors";

import { paraphraseGoals } from "./paraphrase-types";

const paraphraseOptionSchema = z
  .object({
    text: z.string().min(1).max(5_000),
    explanation: z.string().min(1).max(2_000),
  })
  .strict();

export const paraphraseResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    originalText: z.string().min(1).max(5_000),
    goal: z.enum(paraphraseGoals),
    summary: z.string().min(1).max(2_000),
    options: z.array(paraphraseOptionSchema).min(1).max(3),
  })
  .strict();

export function validateParaphraseProviderResult(value: unknown) {
  const result = paraphraseResultSchema.safeParse(value);

  if (!result.success) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The paraphrasing service returned an invalid response.",
      retryable: true,
      cause: result.error,
    });
  }

  return result.data;
}

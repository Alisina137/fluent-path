import { z } from "zod";

import { WritingEvaluationError } from "../evaluation/errors";

import { vocabularySuggestionKinds } from "./vocabulary-types";

const vocabularySuggestionSchema = z
  .object({
    originalText: z.string().min(1).max(1_000),

    suggestedText: z.string().min(1).max(1_000),

    kind: z.enum(vocabularySuggestionKinds),

    explanation: z.string().min(1).max(2_000),

    example: z.string().max(1_000).nullable(),
  })
  .strict();

export const vocabularySuggestionResultSchema = z
  .object({
    schemaVersion: z.literal(1),

    originalText: z.string().min(1).max(5_000),

    summary: z.string().min(1).max(2_000),

    suggestions: z.array(vocabularySuggestionSchema).max(20),
  })
  .strict();

export function validateVocabularySuggestionProviderResult(value: unknown) {
  const result = vocabularySuggestionResultSchema.safeParse(value);

  if (!result.success) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The vocabulary suggestion service returned an invalid response.",
      retryable: true,
      cause: result.error,
    });
  }

  return result.data;
}

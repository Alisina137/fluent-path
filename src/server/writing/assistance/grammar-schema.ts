import { z } from "zod";

import { WritingEvaluationError } from "../evaluation/errors";

import { grammarHelpCategories } from "./types";

export const grammarHelpProviderSchema = z
  .object({
    schemaVersion: z.literal(1),

    originalText: z.string().trim().min(1).max(5_000),

    correctedText: z.string().trim().min(1).max(5_000),

    hasErrors: z.boolean(),

    summary: z.string().trim().min(1).max(2_000),

    issues: z
      .array(
        z
          .object({
            originalText: z.string().trim().min(1).max(1_000),

            correctedText: z.string().trim().min(1).max(1_000),

            category: z.enum(grammarHelpCategories),

            explanation: z.string().trim().min(1).max(2_000),

            example: z.string().trim().min(1).max(1_000).nullable(),
          })
          .strict(),
      )
      .max(30),
  })
  .strict();

export type ValidatedGrammarHelpResult = z.infer<typeof grammarHelpProviderSchema>;

export function validateGrammarHelpProviderResult(value: unknown): ValidatedGrammarHelpResult {
  const parsed = grammarHelpProviderSchema.safeParse(value);

  if (!parsed.success) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The grammar help service returned an invalid result.",
      retryable: true,
      cause: parsed.error,
    });
  }

  return parsed.data;
}

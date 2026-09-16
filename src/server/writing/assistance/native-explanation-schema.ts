import { z } from "zod";

import { WritingEvaluationError } from "../evaluation/errors";

import { writingNativeLanguages } from "./native-explanation-types";

export const nativeExplanationResultSchema = z
  .object({
    schemaVersion: z.literal(1),

    targetLanguage: z.enum(writingNativeLanguages),

    explanation: z.string().min(1).max(5_000),
  })
  .strict();

export function validateNativeExplanationProviderResult(value: unknown) {
  const result = nativeExplanationResultSchema.safeParse(value);

  if (!result.success) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The native-language explanation service returned an invalid response.",
      retryable: true,
      cause: result.error,
    });
  }

  return result.data;
}

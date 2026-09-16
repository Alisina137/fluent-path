import { z } from "zod";

import { WritingEvaluationError } from "../evaluation/errors";

import { toneGuidanceCategories, writingToneTargets } from "./tone-types";

const toneGuidanceIssueSchema = z
  .object({
    originalText: z.string().min(1).max(1_000),
    suggestedText: z.string().min(1).max(1_000),
    category: z.enum(toneGuidanceCategories),
    explanation: z.string().min(1).max(2_000),
  })
  .strict();

export const toneGuidanceResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    originalText: z.string().min(1).max(5_000),
    targetTone: z.enum(writingToneTargets),
    matchesTargetTone: z.boolean(),
    detectedTone: z.string().min(1).max(500),
    summary: z.string().min(1).max(2_000),
    issues: z.array(toneGuidanceIssueSchema).max(20),
  })
  .strict();

export function validateToneGuidanceProviderResult(value: unknown) {
  const result = toneGuidanceResultSchema.safeParse(value);

  if (!result.success) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The tone guidance service returned an invalid response.",
      retryable: true,
      cause: result.error,
    });
  }

  return result.data;
}

import { z } from "zod";

import { coherenceIssueCategories } from "./coherence/types";
import { grammarIssueCategories } from "./grammar/types";
import { mechanicsIssueCategories } from "./mechanics/types";
import { taskAchievementIssueCategories } from "./task-achievement/types";
import { vocabularyIssueCategories } from "./vocabulary/types";
import { WritingEvaluationError } from "./errors";

const scoreSchema = z.number().int().min(0).max(100);

const severitySchema = z.enum(["minor", "moderate", "major"]);

const cefrSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const strengthSchema = z
  .object({
    category: z.string().trim().min(1).max(100),
    message: z.string().trim().min(1).max(1_000),
  })
  .strict();

function createIssueSchema<T extends readonly [string, ...string[]]>(categories: T) {
  return z
    .object({
      category: z.enum(categories),
      severity: severitySchema,
      message: z.string().trim().min(1).max(1_000),
      explanation: z.string().trim().min(1).max(2_000),
      originalText: z.string().max(5_000).nullable(),
      suggestedText: z.string().max(5_000).nullable(),
      startOffset: z.number().int().min(0).nullable(),
      endOffset: z.number().int().min(0).nullable(),
    })
    .strict();
}

function createDimensionSchema<T extends readonly [string, ...string[]]>(categories: T) {
  return z
    .object({
      score: scoreSchema,
      summary: z.string().trim().min(1).max(2_000),
      strengths: z.array(strengthSchema).max(20),
      issues: z.array(createIssueSchema(categories)).max(100),
    })
    .strict();
}

export const writingProviderEvaluationSchema = z
  .object({
    schemaVersion: z.literal(1),

    estimatedCefrLevel: cefrSchema,

    summary: z.string().trim().min(1).max(3_000),

    dimensions: z
      .object({
        grammar: createDimensionSchema(grammarIssueCategories),

        vocabulary: createDimensionSchema(vocabularyIssueCategories),

        coherence: createDimensionSchema(coherenceIssueCategories),

        taskAchievement: createDimensionSchema(taskAchievementIssueCategories),

        mechanics: createDimensionSchema(mechanicsIssueCategories),
      })
      .strict(),

    nextSteps: z.array(z.string().trim().min(1).max(1_000)).max(10),
  })
  .strict();

export type ValidatedWritingProviderEvaluation = z.infer<typeof writingProviderEvaluationSchema>;

export function validateWritingProviderEvaluation(
  value: unknown,
  learnerText: string,
): ValidatedWritingProviderEvaluation {
  const parsed = writingProviderEvaluationSchema.safeParse(value);

  if (!parsed.success) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The writing evaluation service returned an invalid result.",
      retryable: true,
      cause: parsed.error,
    });
  }

  for (const dimension of Object.values(parsed.data.dimensions)) {
    for (const issue of dimension.issues) {
      validateIssueOffsets(learnerText, issue.startOffset, issue.endOffset, issue.originalText);
    }
  }

  return parsed.data;
}

function validateIssueOffsets(
  learnerText: string,
  startOffset: number | null,
  endOffset: number | null,
  originalText: string | null,
): void {
  if (startOffset === null && endOffset === null) {
    return;
  }

  if (
    startOffset === null ||
    endOffset === null ||
    startOffset >= endOffset ||
    endOffset > learnerText.length
  ) {
    throwInvalidOffset();
  }

  if (originalText !== null && learnerText.slice(startOffset, endOffset) !== originalText) {
    throwInvalidOffset();
  }
}

function throwInvalidOffset(): never {
  throw new WritingEvaluationError({
    code: "invalid_provider_response",
    message: "The writing evaluation service returned invalid text references.",
    retryable: true,
  });
}

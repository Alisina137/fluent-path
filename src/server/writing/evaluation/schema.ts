import { z } from "zod";

import { coherenceIssueCategories } from "./coherence/types";
import { WritingEvaluationError } from "./errors";
import { grammarIssueCategories } from "./grammar/types";
import { mechanicsIssueCategories } from "./mechanics/types";
import { taskAchievementIssueCategories } from "./task-achievement/types";
import { vocabularyIssueCategories } from "./vocabulary/types";

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

  return normalizeIssueOffsets(parsed.data, learnerText);
}

function normalizeIssueOffsets(
  evaluation: ValidatedWritingProviderEvaluation,
  learnerText: string,
): ValidatedWritingProviderEvaluation {
  for (const dimension of Object.values(evaluation.dimensions)) {
    for (const issue of dimension.issues) {
      const originalText = issue.originalText;

      if (!originalText) {
        issue.startOffset = null;
        issue.endOffset = null;

        continue;
      }

      const firstIndex = learnerText.indexOf(originalText);

      if (firstIndex === -1) {
        issue.startOffset = null;
        issue.endOffset = null;

        continue;
      }

      const secondIndex = learnerText.indexOf(originalText, firstIndex + originalText.length);

      if (secondIndex !== -1) {
        issue.startOffset = null;
        issue.endOffset = null;

        continue;
      }

      issue.startOffset = firstIndex;
      issue.endOffset = firstIndex + originalText.length;
    }
  }

  return evaluation;
}

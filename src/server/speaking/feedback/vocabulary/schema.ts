import { z } from "zod";

export const vocabularyIssueCategorySchema = z.enum([
  "word_choice",
  "repetition",
  "collocation",
  "precision",
  "register",
  "word_form",
  "natural_expression",
  "other",
]);

export const vocabularyIssueSeveritySchema = z.enum(["minor", "medium", "major"]);

export const vocabularyIssueSchema = z.object({
  category: vocabularyIssueCategorySchema,
  severity: vocabularyIssueSeveritySchema,
  original: z.string().trim().min(1).max(500),
  suggestion: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(800),
});

export const vocabularyStrengthSchema = z.object({
  expression: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(800),
});

export const vocabularyEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),

  range: z.enum(["basic", "developing", "good", "strong"]),

  isAppropriate: z.boolean(),

  summary: z.string().trim().min(1).max(1_000),

  suggestedText: z.string().trim().min(1).max(10_000),

  strengths: z.array(vocabularyStrengthSchema).max(8),

  issues: z.array(vocabularyIssueSchema).max(20),
});

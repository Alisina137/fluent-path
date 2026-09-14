import { z } from "zod";

export const fluencyLevelSchema = z.enum(["limited", "developing", "functional", "smooth"]);

export const fluencyIssueCategorySchema = z.enum([
  "fragmentation",
  "repetition",
  "filler_usage",
  "discourse_flow",
  "idea_development",
  "other",
]);

export const fluencyIssueSeveritySchema = z.enum(["minor", "medium", "major"]);

export const fluencyStrengthSchema = z.object({
  evidence: z.string().trim().min(1).max(500),

  explanation: z.string().trim().min(1).max(800),
});

export const fluencyIssueSchema = z.object({
  category: fluencyIssueCategorySchema,

  severity: fluencyIssueSeveritySchema,

  evidence: z.string().trim().min(1).max(500),

  suggestion: z.string().trim().min(1).max(800),

  explanation: z.string().trim().min(1).max(800),
});

export const fluencyAiEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),

  level: fluencyLevelSchema,

  summary: z.string().trim().min(1).max(1_000),

  improvementTip: z.string().trim().min(1).max(1_000),

  strengths: z.array(fluencyStrengthSchema).max(8),

  issues: z.array(fluencyIssueSchema).max(20),
});

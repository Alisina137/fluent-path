import { z } from "zod";

export const grammarIssueCategorySchema = z.enum([
  "verb_tense",
  "subject_verb_agreement",
  "articles",
  "prepositions",
  "pronouns",
  "pluralization",
  "word_order",
  "sentence_structure",
  "auxiliary_verbs",
  "conditionals",
  "comparatives",
  "other",
]);

export const grammarIssueSeveritySchema = z.enum(["minor", "medium", "major"]);

export const grammarIssueSchema = z.object({
  category: grammarIssueCategorySchema,
  severity: grammarIssueSeveritySchema,
  original: z.string().trim().min(1).max(500),
  correction: z.string().trim().min(1).max(500),
  explanation: z.string().trim().min(1).max(800),
});

export const grammarEvaluationSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().int().min(0).max(100),
  correctedText: z.string().trim().min(1).max(10_000),
  summary: z.string().trim().min(1).max(1_000),
  issues: z.array(grammarIssueSchema).max(20),
});

import type { WritingCefrLevel } from "./scoring/cefr";

export const WRITING_EVALUATION_SCHEMA_VERSION = 1 as const;

export const writingEvaluationDimensions = [
  "grammar",
  "vocabulary",
  "coherence",
  "taskAchievement",
  "mechanics",
] as const;

export type WritingEvaluationDimension = (typeof writingEvaluationDimensions)[number];

export interface WritingEvaluationTaskContext {
  source: "task" | "custom";
  title: string | null;
  prompt: string | null;
  category: string | null;
  writingType: string;
  targetCefrLevel: WritingCefrLevel;
  minWords: number | null;
  maxWords: number | null;
  audience: string | null;
  purpose: string | null;
  tone: string | null;
}

export interface WritingEvaluationRevision {
  id: string;
  revisionNumber: number;
  content: string;
  wordCount: number;
  characterCount: number;
}

export interface WritingEvaluationRequest {
  revision: WritingEvaluationRevision;
  task: WritingEvaluationTaskContext;
}

export interface WritingEvaluationIssue {
  category: string;
  severity: "minor" | "moderate" | "major";
  message: string;
  explanation: string;
  originalText: string | null;
  suggestedText: string | null;
  startOffset: number | null;
  endOffset: number | null;
}

export interface WritingEvaluationStrength {
  category: string;
  message: string;
}

export interface WritingDimensionEvaluation {
  score: number;
  summary: string;
  strengths: WritingEvaluationStrength[];
  issues: WritingEvaluationIssue[];
}

export interface WritingProviderEvaluation {
  schemaVersion: typeof WRITING_EVALUATION_SCHEMA_VERSION;

  estimatedCefrLevel: string;

  summary: string;

  dimensions: {
    grammar: WritingDimensionEvaluation;
    vocabulary: WritingDimensionEvaluation;
    coherence: WritingDimensionEvaluation;
    taskAchievement: WritingDimensionEvaluation;
    mechanics: WritingDimensionEvaluation;
  };

  nextSteps: string[];
}

export interface WritingEvaluationResult extends WritingProviderEvaluation {
  overallScore: number;

  provider: string;
  model: string;
  providerRequestId: string | null;
}

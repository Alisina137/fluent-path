import type { WritingEvaluationDimension } from "../evaluation/types";

export const writingFeedbackSeverities = ["minor", "moderate", "major"] as const;

export type WritingFeedbackSeverity = (typeof writingFeedbackSeverities)[number];

export interface WritingFeedbackBase {
  id: string;
  dimension: WritingEvaluationDimension;
  category: string;
  severity: WritingFeedbackSeverity;
  message: string;
  explanation: string;
  suggestedText: string | null;
}

export interface WritingTextFeedback extends WritingFeedbackBase {
  kind: "text";
  originalText: string;
  startOffset: number;
  endOffset: number;
}

export interface WritingGlobalFeedback extends WritingFeedbackBase {
  kind: "global";
  originalText: string | null;
  startOffset: null;
  endOffset: null;
}

export type WritingFeedbackItem = WritingTextFeedback | WritingGlobalFeedback;

export interface WritingFeedbackCollection {
  items: WritingFeedbackItem[];
  textItems: WritingTextFeedback[];
  globalItems: WritingGlobalFeedback[];
  counts: {
    total: number;
    minor: number;
    moderate: number;
    major: number;
  };
}

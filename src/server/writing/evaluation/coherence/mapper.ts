import type { WritingDimensionEvaluation } from "../types";

import type { CoherenceEvaluation } from "./types";

export function mapCoherenceEvaluation(
  evaluation: CoherenceEvaluation,
): WritingDimensionEvaluation {
  return {
    score: evaluation.score,

    summary: evaluation.summary,

    strengths: evaluation.strengths.map((strength) => ({
      category: "coherence",
      message: strength.message,
    })),

    issues: evaluation.issues.map((issue) => ({
      category: issue.category,
      severity: issue.severity,
      message: issue.explanation,
      explanation: issue.explanation,
      originalText: issue.originalText,
      suggestedText: issue.suggestedText,
      startOffset: issue.startOffset,
      endOffset: issue.endOffset,
    })),
  };
}

import {
  writingEvaluationDimensions,
  type WritingEvaluationDimension,
  type WritingEvaluationIssue,
  type WritingEvaluationResult,
} from "../evaluation/types";

import { sortWritingFeedback } from "./sort";

import type {
  WritingFeedbackCollection,
  WritingFeedbackItem,
  WritingFeedbackSeverity,
  WritingGlobalFeedback,
  WritingTextFeedback,
} from "./types";

export function normalizeWritingFeedback(
  evaluation: WritingEvaluationResult,
): WritingFeedbackCollection {
  const items: WritingFeedbackItem[] = [];

  for (const dimension of writingEvaluationDimensions) {
    const dimensionEvaluation = evaluation.dimensions[dimension];

    for (let issueIndex = 0; issueIndex < dimensionEvaluation.issues.length; issueIndex += 1) {
      const issue = dimensionEvaluation.issues[issueIndex];

      if (!issue) {
        continue;
      }

      items.push(normalizeIssue(evaluation, dimension, issue, issueIndex));
    }
  }

  const sortedItems = sortWritingFeedback(items);

  const textItems = sortedItems.filter((item): item is WritingTextFeedback => item.kind === "text");

  const globalItems = sortedItems.filter(
    (item): item is WritingGlobalFeedback => item.kind === "global",
  );

  return {
    items: sortedItems,
    textItems,
    globalItems,

    counts: {
      total: sortedItems.length,

      minor: countSeverity(sortedItems, "minor"),

      moderate: countSeverity(sortedItems, "moderate"),

      major: countSeverity(sortedItems, "major"),
    },
  };
}

function normalizeIssue(
  evaluation: WritingEvaluationResult,
  dimension: WritingEvaluationDimension,
  issue: WritingEvaluationIssue,
  issueIndex: number,
): WritingFeedbackItem {
  const base = {
    id: createFeedbackId(evaluation, dimension, issueIndex),

    dimension,
    category: issue.category,
    severity: issue.severity,
    message: issue.message,
    explanation: issue.explanation,
    suggestedText: issue.suggestedText,
  };

  if (hasTextLocation(issue)) {
    return {
      ...base,

      kind: "text",

      originalText: issue.originalText,

      startOffset: issue.startOffset,

      endOffset: issue.endOffset,
    };
  }

  return {
    ...base,

    kind: "global",

    originalText: issue.originalText,

    startOffset: null,

    endOffset: null,
  };
}

function hasTextLocation(issue: WritingEvaluationIssue): issue is WritingEvaluationIssue & {
  originalText: string;
  startOffset: number;
  endOffset: number;
} {
  return (
    typeof issue.originalText === "string" &&
    issue.originalText.length > 0 &&
    typeof issue.startOffset === "number" &&
    typeof issue.endOffset === "number" &&
    issue.startOffset >= 0 &&
    issue.endOffset > issue.startOffset
  );
}

function createFeedbackId(
  evaluation: WritingEvaluationResult,
  dimension: WritingEvaluationDimension,
  issueIndex: number,
): string {
  return ["writing-feedback", evaluation.schemaVersion, dimension, issueIndex].join(":");
}

function countSeverity(items: WritingFeedbackItem[], severity: WritingFeedbackSeverity): number {
  return items.reduce((count, item) => (item.severity === severity ? count + 1 : count), 0);
}

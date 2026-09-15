import type { WritingFeedbackItem, WritingFeedbackSeverity } from "./types";

const severityPriority: Record<WritingFeedbackSeverity, number> = {
  major: 0,
  moderate: 1,
  minor: 2,
};

export function sortWritingFeedback(items: WritingFeedbackItem[]): WritingFeedbackItem[] {
  return [...items].sort(compareFeedback);
}

function compareFeedback(left: WritingFeedbackItem, right: WritingFeedbackItem): number {
  if (left.kind === "text" && right.kind === "text") {
    if (left.startOffset !== right.startOffset) {
      return left.startOffset - right.startOffset;
    }

    const severityDifference = compareSeverity(left.severity, right.severity);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return left.id.localeCompare(right.id);
  }

  if (left.kind === "global" && right.kind === "global") {
    const severityDifference = compareSeverity(left.severity, right.severity);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return left.id.localeCompare(right.id);
  }

  if (left.kind === "text") {
    return -1;
  }

  return 1;
}

function compareSeverity(left: WritingFeedbackSeverity, right: WritingFeedbackSeverity): number {
  return severityPriority[left] - severityPriority[right];
}

import type { WritingEvaluationDimension } from "../evaluation/types";

import type { WritingFeedbackItem, WritingFeedbackSeverity } from "./types";

export interface WritingFeedbackExample {
  before: string;
  after: string;
}

export interface WritingFeedbackExplanation {
  feedbackId: string;
  dimensionDescription: string;
  dimension: WritingEvaluationDimension;

  dimensionLabel: string;

  category: string;

  categoryLabel: string;

  severity: WritingFeedbackSeverity;

  severityLabel: string;

  title: string;

  explanation: string;

  suggestion: string | null;

  example: WritingFeedbackExample | null;

  hasCorrection: boolean;
}

const dimensionLabels: Record<WritingEvaluationDimension, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  coherence: "Coherence & Organization",
  taskAchievement: "Task Achievement",
  mechanics: "Spelling & Mechanics",
};

const dimensionDescriptions: Record<WritingEvaluationDimension, string> = {
  grammar: "How accurately you use English sentence structures and grammatical forms.",

  vocabulary: "How accurately and appropriately you choose and combine words.",

  coherence: "How clearly your ideas are organized, connected, and developed.",

  taskAchievement: "How successfully your writing answers the task and fulfills its purpose.",

  mechanics:
    "How accurately you use spelling, punctuation, capitalization, and written conventions.",
};

const severityLabels: Record<WritingFeedbackSeverity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};

export function buildWritingFeedbackExplanation(
  feedback: WritingFeedbackItem,
): WritingFeedbackExplanation {
  const suggestion = normalizeOptionalText(feedback.suggestedText);

  const example = buildCorrectionExample(feedback, suggestion);

  return {
    feedbackId: feedback.id,

    dimension: feedback.dimension,

    dimensionLabel: dimensionLabels[feedback.dimension],
    dimensionDescription: dimensionDescriptions[feedback.dimension],

    category: feedback.category,

    categoryLabel: formatFeedbackCategory(feedback.category),

    severity: feedback.severity,

    severityLabel: severityLabels[feedback.severity],

    title: feedback.message.trim(),

    explanation: feedback.explanation.trim(),

    suggestion,

    example,

    hasCorrection: example !== null,
  };
}

export function buildWritingFeedbackExplanations(
  feedback: WritingFeedbackItem[],
): WritingFeedbackExplanation[] {
  return feedback.map(buildWritingFeedbackExplanation);
}

function buildCorrectionExample(
  feedback: WritingFeedbackItem,
  suggestion: string | null,
): WritingFeedbackExample | null {
  if (feedback.kind !== "text" || !suggestion) {
    return null;
  }

  const before = feedback.originalText.trim();

  if (!before || before === suggestion) {
    return null;
  }

  return {
    before,
    after: suggestion,
  };
}

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

export function formatFeedbackCategory(category: string): string {
  const normalized = category.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

  if (!normalized) {
    return "Other";
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

import {
  writingEvaluationDimensions,
  type WritingDimensionEvaluation,
  type WritingEvaluationDimension,
  type WritingEvaluationResult,
  type WritingEvaluationStrength,
} from "../evaluation/types";

import type { WritingFeedbackCollection, WritingFeedbackSeverity } from "./types";

export interface WritingOverallDimensionFeedback {
  dimension: WritingEvaluationDimension;
  score: number;
  summary: string;
  strengths: WritingEvaluationStrength[];
  issueCount: number;
  majorIssueCount: number;
  moderateIssueCount: number;
  minorIssueCount: number;
}

export interface WritingOverallStrength {
  dimension: WritingEvaluationDimension;
  category: string;
  message: string;
}

export interface WritingPriorityImprovement {
  dimension: WritingEvaluationDimension;
  category: string;
  severity: WritingFeedbackSeverity;
  message: string;
  explanation: string;
}

export interface WritingOverallFeedback {
  overallScore: number;
  estimatedCefrLevel: string;
  summary: string;

  dimensions: WritingOverallDimensionFeedback[];

  strengths: WritingOverallStrength[];

  priorityImprovements: WritingPriorityImprovement[];

  nextSteps: string[];

  issueCounts: {
    total: number;
    major: number;
    moderate: number;
    minor: number;
  };
}

const MAX_OVERALL_STRENGTHS = 5;
const MAX_PRIORITY_IMPROVEMENTS = 5;

export function buildOverallWritingFeedback(
  evaluation: WritingEvaluationResult,
  feedback: WritingFeedbackCollection,
): WritingOverallFeedback {
  return {
    overallScore: evaluation.overallScore,

    estimatedCefrLevel: evaluation.estimatedCefrLevel,

    summary: evaluation.summary,

    dimensions: writingEvaluationDimensions.map((dimension) =>
      buildDimensionFeedback(dimension, evaluation.dimensions[dimension]),
    ),

    strengths: selectOverallStrengths(evaluation),

    priorityImprovements: selectPriorityImprovements(feedback),

    nextSteps: [...evaluation.nextSteps],

    issueCounts: {
      total: feedback.counts.total,
      major: feedback.counts.major,
      moderate: feedback.counts.moderate,
      minor: feedback.counts.minor,
    },
  };
}

function buildDimensionFeedback(
  dimension: WritingEvaluationDimension,
  evaluation: WritingDimensionEvaluation,
): WritingOverallDimensionFeedback {
  return {
    dimension,
    score: evaluation.score,
    summary: evaluation.summary,
    strengths: [...evaluation.strengths],

    issueCount: evaluation.issues.length,

    majorIssueCount: countDimensionSeverity(evaluation, "major"),

    moderateIssueCount: countDimensionSeverity(evaluation, "moderate"),

    minorIssueCount: countDimensionSeverity(evaluation, "minor"),
  };
}

function selectOverallStrengths(evaluation: WritingEvaluationResult): WritingOverallStrength[] {
  const candidates: WritingOverallStrength[] = [];

  const dimensionsByScore = [...writingEvaluationDimensions].sort(
    (left, right) =>
      evaluation.dimensions[right].score - evaluation.dimensions[left].score ||
      writingEvaluationDimensions.indexOf(left) - writingEvaluationDimensions.indexOf(right),
  );

  for (const dimension of dimensionsByScore) {
    for (const strength of evaluation.dimensions[dimension].strengths) {
      candidates.push({
        dimension,
        category: strength.category,
        message: strength.message,
      });

      if (candidates.length >= MAX_OVERALL_STRENGTHS) {
        return candidates;
      }
    }
  }

  return candidates;
}

function selectPriorityImprovements(
  feedback: WritingFeedbackCollection,
): WritingPriorityImprovement[] {
  return [...feedback.items]
    .sort(compareImprovementPriority)
    .slice(0, MAX_PRIORITY_IMPROVEMENTS)
    .map((item) => ({
      dimension: item.dimension,
      category: item.category,
      severity: item.severity,
      message: item.message,
      explanation: item.explanation,
    }));
}

function compareImprovementPriority(
  left: WritingFeedbackCollection["items"][number],
  right: WritingFeedbackCollection["items"][number],
): number {
  const severityDifference = severityPriority(left.severity) - severityPriority(right.severity);

  if (severityDifference !== 0) {
    return severityDifference;
  }

  const dimensionDifference =
    dimensionPriority(left.dimension) - dimensionPriority(right.dimension);

  if (dimensionDifference !== 0) {
    return dimensionDifference;
  }

  if (left.kind === "text" && right.kind === "text") {
    return left.startOffset - right.startOffset || left.id.localeCompare(right.id);
  }

  if (left.kind === "text") {
    return -1;
  }

  if (right.kind === "text") {
    return 1;
  }

  return left.id.localeCompare(right.id);
}

function severityPriority(severity: WritingFeedbackSeverity): number {
  switch (severity) {
    case "major":
      return 0;

    case "moderate":
      return 1;

    case "minor":
      return 2;
  }
}

function dimensionPriority(dimension: WritingEvaluationDimension): number {
  return writingEvaluationDimensions.indexOf(dimension);
}

function countDimensionSeverity(
  evaluation: WritingDimensionEvaluation,
  severity: WritingFeedbackSeverity,
): number {
  return evaluation.issues.reduce(
    (count, issue) => (issue.severity === severity ? count + 1 : count),
    0,
  );
}

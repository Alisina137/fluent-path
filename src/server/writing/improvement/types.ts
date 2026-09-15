export type WritingScoreDimension =
  "grammar" | "vocabulary" | "coherence" | "taskAchievement" | "mechanics";

export type WritingImprovementClassification =
  "strong_improvement" | "improvement" | "mixed" | "unchanged" | "decline";

export interface WritingDimensionScore {
  dimension: WritingScoreDimension;
  score: number;
}

export interface WritingDimensionImprovement {
  dimension: WritingScoreDimension;
  beforeScore: number;
  afterScore: number;
  difference: number;
}

export interface WritingImprovementMeasurement {
  available: boolean;

  classification: WritingImprovementClassification | null;

  overall: {
    beforeScore: number;
    afterScore: number;
    difference: number;
  } | null;

  dimensions: WritingDimensionImprovement[];

  strongestImprovement: WritingDimensionImprovement | null;

  improvedDimensions: number;
  declinedDimensions: number;
  unchangedDimensions: number;
}

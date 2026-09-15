import type { WritingDimensionScore, WritingImprovementMeasurement } from "../improvement/types";

export type WritingComparisonChangeType = "unchanged" | "added" | "removed";

export interface WritingComparisonSegment {
  type: WritingComparisonChangeType;
  text: string;
}

export interface WritingRevisionComparisonSide {
  id: string;
  revisionNumber: number;
  content: string;
  wordCount: number;
  characterCount: number;
  createdAt: Date;
  overallScore: number | null;
  dimensionScores: WritingDimensionScore[];
}

export interface WritingRevisionComparison {
  before: WritingRevisionComparisonSide;
  after: WritingRevisionComparisonSide;

  beforeSegments: WritingComparisonSegment[];
  afterSegments: WritingComparisonSegment[];

  statistics: {
    wordCountDifference: number;
    characterCountDifference: number;
    scoreDifference: number | null;
    addedWordCount: number;
    removedWordCount: number;
  };

  improvement: WritingImprovementMeasurement;
}

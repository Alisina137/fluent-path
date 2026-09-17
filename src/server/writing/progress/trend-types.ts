import type { WritingSkillScores } from "./types";

export type WritingTrendDirection = "improving" | "stable" | "declining" | "insufficient-data";

export interface WritingScoreTrend {
  direction: WritingTrendDirection;
  change: number | null;
  previousAverage: number | null;
  recentAverage: number | null;
}

export interface WritingDimensionTrends {
  overall: WritingScoreTrend;
  grammar: WritingScoreTrend;
  vocabulary: WritingScoreTrend;
  coherence: WritingScoreTrend;
  taskAchievement: WritingScoreTrend;
  mechanics: WritingScoreTrend;
}

export interface WritingTrendPoint {
  revisionId: string;
  sessionId: string;
  revisionNumber: number;
  evaluatedAt: Date;
  scores: WritingSkillScores;
}

export interface WritingImprovementTrends {
  evaluatedRevisionCount: number;

  previousWindowSize: number;
  recentWindowSize: number;

  trends: WritingDimensionTrends;

  history: WritingTrendPoint[];
}

export interface WritingDimensionScores {
  grammar: number;
  vocabulary: number;
  coherence: number;
  taskAchievement: number;
  mechanics: number;
}

const SCORE_WEIGHTS = {
  grammar: 0.25,
  vocabulary: 0.2,
  coherence: 0.2,
  taskAchievement: 0.25,
  mechanics: 0.1,
} as const satisfies Record<keyof WritingDimensionScores, number>;

export function calculateOverallWritingScore(scores: WritingDimensionScores): number {
  validateScores(scores);

  const weightedScore =
    scores.grammar * SCORE_WEIGHTS.grammar +
    scores.vocabulary * SCORE_WEIGHTS.vocabulary +
    scores.coherence * SCORE_WEIGHTS.coherence +
    scores.taskAchievement * SCORE_WEIGHTS.taskAchievement +
    scores.mechanics * SCORE_WEIGHTS.mechanics;

  return Math.round(weightedScore);
}

function validateScores(scores: WritingDimensionScores): void {
  for (const [dimension, score] of Object.entries(scores)) {
    if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 100) {
      throw new RangeError(
        `Invalid ${dimension} writing score: ${score}. Expected an integer from 0 to 100.`,
      );
    }
  }
}

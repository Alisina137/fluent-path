import type { WritingSkillMetrics, WritingSkillScores } from "./types";

export interface WritingMetricEvaluation {
  sessionId: string;
  createdAt: Date;

  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  taskAchievementScore: number;
  mechanicsScore: number;
}

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

function toSkillScores(evaluation: WritingMetricEvaluation): WritingSkillScores {
  return {
    overall: evaluation.overallScore,
    grammar: evaluation.grammarScore,
    vocabulary: evaluation.vocabularyScore,
    coherence: evaluation.coherenceScore,
    taskAchievement: evaluation.taskAchievementScore,
    mechanics: evaluation.mechanicsScore,
  };
}

function calculateAverageScores(
  evaluations: readonly WritingMetricEvaluation[],
): WritingSkillScores {
  const totals = evaluations.reduce(
    (current, evaluation) => ({
      overall: current.overall + evaluation.overallScore,
      grammar: current.grammar + evaluation.grammarScore,
      vocabulary: current.vocabulary + evaluation.vocabularyScore,
      coherence: current.coherence + evaluation.coherenceScore,
      taskAchievement: current.taskAchievement + evaluation.taskAchievementScore,
      mechanics: current.mechanics + evaluation.mechanicsScore,
    }),
    {
      overall: 0,
      grammar: 0,
      vocabulary: 0,
      coherence: 0,
      taskAchievement: 0,
      mechanics: 0,
    },
  );

  const count = evaluations.length;

  return {
    overall: roundMetric(totals.overall / count),
    grammar: roundMetric(totals.grammar / count),
    vocabulary: roundMetric(totals.vocabulary / count),
    coherence: roundMetric(totals.coherence / count),
    taskAchievement: roundMetric(totals.taskAchievement / count),
    mechanics: roundMetric(totals.mechanics / count),
  };
}

export function calculateWritingSkillMetrics(
  evaluations: readonly WritingMetricEvaluation[],
): WritingSkillMetrics {
  if (evaluations.length === 0) {
    return {
      evaluatedRevisionCount: 0,
      evaluatedSessionCount: 0,
      latest: null,
      averages: null,
    };
  }

  const latestEvaluation = evaluations.reduce((latest, evaluation) =>
    evaluation.createdAt.getTime() > latest.createdAt.getTime() ? evaluation : latest,
  );

  const evaluatedSessionCount = new Set(evaluations.map((evaluation) => evaluation.sessionId)).size;

  return {
    evaluatedRevisionCount: evaluations.length,
    evaluatedSessionCount,

    latest: toSkillScores(latestEvaluation),

    averages: calculateAverageScores(evaluations),
  };
}

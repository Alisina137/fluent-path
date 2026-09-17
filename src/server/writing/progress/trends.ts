import type {
  WritingDimensionTrends,
  WritingImprovementTrends,
  WritingScoreTrend,
  WritingTrendDirection,
  WritingTrendPoint,
} from "./trend-types";
import type { WritingSkillScores } from "./types";

const MINIMUM_TREND_EVALUATIONS = 3;
const MEANINGFUL_CHANGE_THRESHOLD = 2;

type ScoreKey = keyof WritingSkillScores;

function roundMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(points: readonly WritingTrendPoint[], key: ScoreKey): number {
  const total = points.reduce((sum, point) => sum + point.scores[key], 0);

  return roundMetric(total / points.length);
}

function classifyDirection(change: number): WritingTrendDirection {
  if (change >= MEANINGFUL_CHANGE_THRESHOLD) {
    return "improving";
  }

  if (change <= -MEANINGFUL_CHANGE_THRESHOLD) {
    return "declining";
  }

  return "stable";
}

function buildInsufficientTrend(): WritingScoreTrend {
  return {
    direction: "insufficient-data",
    change: null,
    previousAverage: null,
    recentAverage: null,
  };
}

function calculateScoreTrend(
  previous: readonly WritingTrendPoint[],
  recent: readonly WritingTrendPoint[],
  key: ScoreKey,
): WritingScoreTrend {
  const previousAverage = average(previous, key);
  const recentAverage = average(recent, key);

  const change = roundMetric(recentAverage - previousAverage);

  return {
    direction: classifyDirection(change),
    change,
    previousAverage,
    recentAverage,
  };
}

function buildInsufficientDimensionTrends(): WritingDimensionTrends {
  return {
    overall: buildInsufficientTrend(),
    grammar: buildInsufficientTrend(),
    vocabulary: buildInsufficientTrend(),
    coherence: buildInsufficientTrend(),
    taskAchievement: buildInsufficientTrend(),
    mechanics: buildInsufficientTrend(),
  };
}

function calculateDimensionTrends(
  previous: readonly WritingTrendPoint[],
  recent: readonly WritingTrendPoint[],
): WritingDimensionTrends {
  return {
    overall: calculateScoreTrend(previous, recent, "overall"),
    grammar: calculateScoreTrend(previous, recent, "grammar"),
    vocabulary: calculateScoreTrend(previous, recent, "vocabulary"),
    coherence: calculateScoreTrend(previous, recent, "coherence"),
    taskAchievement: calculateScoreTrend(previous, recent, "taskAchievement"),
    mechanics: calculateScoreTrend(previous, recent, "mechanics"),
  };
}

export function calculateWritingImprovementTrends(
  inputHistory: readonly WritingTrendPoint[],
): WritingImprovementTrends {
  const history = [...inputHistory].sort(
    (a, b) => a.evaluatedAt.getTime() - b.evaluatedAt.getTime(),
  );

  if (history.length < MINIMUM_TREND_EVALUATIONS) {
    return {
      evaluatedRevisionCount: history.length,
      previousWindowSize: 0,
      recentWindowSize: 0,
      trends: buildInsufficientDimensionTrends(),
      history,
    };
  }

  const windowSize = Math.floor(history.length / 2);

  const recent = history.slice(-windowSize);

  const previous = history.slice(-(windowSize * 2), -windowSize);

  return {
    evaluatedRevisionCount: history.length,
    previousWindowSize: previous.length,
    recentWindowSize: recent.length,

    trends: calculateDimensionTrends(previous, recent),

    history,
  };
}

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  speakingFeedbackEvaluations,
  speakingMessages,
  speakingSessions,
  type SpeakingFeedbackSkill,
} from "@/db/schema";

import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export type SpeakingTrendDirection = "improving" | "stable" | "declining" | "insufficient_data";

export type SpeakingTrendPoint = {
  messageId: string;
  sessionId: string;
  score: number;
  evaluatedAt: Date;
};

export type SpeakingSkillTrend = {
  skill: SpeakingFeedbackSkill;

  direction: SpeakingTrendDirection;

  change: number | null;

  recentAverage: number | null;

  previousAverage: number | null;

  latestScore: number | null;

  evaluationCount: number;

  recentEvaluationCount: number;

  previousEvaluationCount: number;

  points: SpeakingTrendPoint[];
};

export type SpeakingImprovementTrends = {
  overall: {
    direction: SpeakingTrendDirection;
    change: number | null;
    recentAverage: number | null;
    previousAverage: number | null;
  };

  skills: {
    grammar: SpeakingSkillTrend;
    vocabulary: SpeakingSkillTrend;
    fluency: SpeakingSkillTrend;
  };

  pronunciation: {
    available: false;
    direction: "insufficient_data";
    reason: "provider_unavailable";
  };
};

type EvaluationRow = {
  messageId: string;
  sessionId: string;
  skill: SpeakingFeedbackSkill;
  score: number;
  evaluatedAt: Date;
};

const TREND_WINDOW_SIZE = 5;
const MINIMUM_TREND_EVALUATIONS = 2;
const STABLE_THRESHOLD = 2;
const MAX_QUERY_ROWS = 300;
const MAX_CHART_POINTS = 20;

const SKILLS: readonly SpeakingFeedbackSkill[] = ["grammar", "vocabulary", "fluency"];

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getTrendDirection(change: number | null): SpeakingTrendDirection {
  if (change === null) {
    return "insufficient_data";
  }

  if (change >= STABLE_THRESHOLD) {
    return "improving";
  }

  if (change <= -STABLE_THRESHOLD) {
    return "declining";
  }

  return "stable";
}

function buildSkillTrend(
  skill: SpeakingFeedbackSkill,
  allRows: readonly EvaluationRow[],
): SpeakingSkillTrend {
  const rows = allRows.filter((row) => row.skill === skill);

  const points = rows.slice(-MAX_CHART_POINTS).map((row) => ({
    messageId: row.messageId,
    sessionId: row.sessionId,
    score: row.score,
    evaluatedAt: row.evaluatedAt,
  }));

  if (rows.length < MINIMUM_TREND_EVALUATIONS) {
    return {
      skill,
      direction: "insufficient_data",
      change: null,
      recentAverage: rows.length > 0 ? average(rows.map((row) => row.score)) : null,
      previousAverage: null,
      latestScore: rows.at(-1)?.score ?? null,
      evaluationCount: rows.length,
      recentEvaluationCount: rows.length,
      previousEvaluationCount: 0,
      points,
    };
  }

  const recentRows = rows.slice(-TREND_WINDOW_SIZE);

  const previousRows = rows.slice(-(TREND_WINDOW_SIZE * 2), -TREND_WINDOW_SIZE);

  /*
   * For learners who have 2–5 evaluations we still want
   * a meaningful early trend. Split available evaluations
   * into an older and newer group.
   */
  if (previousRows.length === 0) {
    const midpoint = Math.floor(rows.length / 2);

    const earlyPrevious = rows.slice(0, midpoint);

    const earlyRecent = rows.slice(midpoint);

    const previousAverage = average(earlyPrevious.map((row) => row.score));

    const recentAverage = average(earlyRecent.map((row) => row.score));

    const change =
      recentAverage !== null && previousAverage !== null
        ? roundScore(recentAverage - previousAverage)
        : null;

    return {
      skill,
      direction: getTrendDirection(change),
      change,
      recentAverage,
      previousAverage,
      latestScore: rows.at(-1)?.score ?? null,
      evaluationCount: rows.length,
      recentEvaluationCount: earlyRecent.length,
      previousEvaluationCount: earlyPrevious.length,
      points,
    };
  }

  const recentAverage = average(recentRows.map((row) => row.score));

  const previousAverage = average(previousRows.map((row) => row.score));

  const change =
    recentAverage !== null && previousAverage !== null
      ? roundScore(recentAverage - previousAverage)
      : null;

  return {
    skill,
    direction: getTrendDirection(change),
    change,
    recentAverage,
    previousAverage,
    latestScore: rows.at(-1)?.score ?? null,
    evaluationCount: rows.length,
    recentEvaluationCount: recentRows.length,
    previousEvaluationCount: previousRows.length,
    points,
  };
}

function calculateOverallTrend(
  trends: readonly SpeakingSkillTrend[],
): SpeakingImprovementTrends["overall"] {
  const comparableTrends = trends.filter(
    (
      trend,
    ): trend is SpeakingSkillTrend & {
      recentAverage: number;
      previousAverage: number;
      change: number;
    } => trend.recentAverage !== null && trend.previousAverage !== null && trend.change !== null,
  );

  if (comparableTrends.length === 0) {
    return {
      direction: "insufficient_data",
      change: null,
      recentAverage: null,
      previousAverage: null,
    };
  }

  const recentAverage = average(comparableTrends.map((trend) => trend.recentAverage));

  const previousAverage = average(comparableTrends.map((trend) => trend.previousAverage));

  const change =
    recentAverage !== null && previousAverage !== null
      ? roundScore(recentAverage - previousAverage)
      : null;

  return {
    direction: getTrendDirection(change),
    change,
    recentAverage,
    previousAverage,
  };
}

export async function getSpeakingImprovementTrends(
  userId: string,
): Promise<SpeakingImprovementTrends> {
  await requireServerModuleAccess(userId, MODULE_IDS.speaking);

  const db = getDb();

  /*
   * Fetch only a bounded amount of recent feedback.
   * This keeps the progress endpoint predictable as
   * a learner accumulates years of speaking history.
   */
  const recentRows = await db
    .select({
      messageId: speakingFeedbackEvaluations.messageId,

      sessionId: speakingMessages.sessionId,

      skill: speakingFeedbackEvaluations.skill,

      score: speakingFeedbackEvaluations.score,

      evaluatedAt: speakingFeedbackEvaluations.createdAt,
    })
    .from(speakingFeedbackEvaluations)
    .innerJoin(speakingMessages, eq(speakingMessages.id, speakingFeedbackEvaluations.messageId))
    .innerJoin(speakingSessions, eq(speakingSessions.id, speakingMessages.sessionId))
    .where(
      and(eq(speakingSessions.userId, userId), eq(speakingSessions.moduleId, MODULE_IDS.speaking)),
    )
    .orderBy(desc(speakingFeedbackEvaluations.createdAt))
    .limit(MAX_QUERY_ROWS);

  /*
   * Database query returns newest first.
   * Trend calculations are simpler and safer when
   * rows are chronological.
   */
  const rows = [...recentRows].reverse() as EvaluationRow[];

  const grammar = buildSkillTrend("grammar", rows);

  const vocabulary = buildSkillTrend("vocabulary", rows);

  const fluency = buildSkillTrend("fluency", rows);

  const skillTrends = [grammar, vocabulary, fluency];

  return {
    overall: calculateOverallTrend(skillTrends),

    skills: {
      grammar,
      vocabulary,
      fluency,
    },

    pronunciation: {
      available: false,
      direction: "insufficient_data",
      reason: "provider_unavailable",
    },
  };
}

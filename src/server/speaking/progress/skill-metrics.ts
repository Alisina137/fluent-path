import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  speakingFeedbackEvaluations,
  speakingMessages,
  speakingSessions,
  type SpeakingFeedbackSkill,
} from "@/db/schema";

import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export type SpeakingSkillMetric = {
  skill: SpeakingFeedbackSkill;
  averageScore: number | null;
  latestScore: number | null;
  bestScore: number | null;
  evaluationCount: number;
};

export type SpeakingSkillMetrics = {
  overallScore: number | null;
  totalEvaluations: number;
  evaluatedMessages: number;

  pronunciation: {
    available: false;
    score: null;
    reason: "provider_unavailable";
  };

  skills: {
    grammar: SpeakingSkillMetric;
    vocabulary: SpeakingSkillMetric;
    fluency: SpeakingSkillMetric;
  };
};

type EvaluationRow = {
  messageId: string;
  skill: SpeakingFeedbackSkill;
  score: number;
  createdAt: Date;
};

const SKILLS: readonly SpeakingFeedbackSkill[] = ["grammar", "vocabulary", "fluency"];

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function createEmptyMetric(skill: SpeakingFeedbackSkill): SpeakingSkillMetric {
  return {
    skill,
    averageScore: null,
    latestScore: null,
    bestScore: null,
    evaluationCount: 0,
  };
}

function calculateSkillMetric(
  skill: SpeakingFeedbackSkill,
  rows: EvaluationRow[],
): SpeakingSkillMetric {
  const skillRows = rows.filter((row) => row.skill === skill);

  if (skillRows.length === 0) {
    return createEmptyMetric(skill);
  }

  const total = skillRows.reduce((sum, row) => sum + row.score, 0);

  const latest = skillRows[skillRows.length - 1];

  const bestScore = Math.max(...skillRows.map((row) => row.score));

  return {
    skill,

    averageScore: roundScore(total / skillRows.length),

    latestScore: latest?.score ?? null,

    bestScore,

    evaluationCount: skillRows.length,
  };
}

export async function getSpeakingSkillMetrics(userId: string): Promise<SpeakingSkillMetrics> {
  await requireServerModuleAccess(userId, MODULE_IDS.speaking);

  const db = getDb();

  const rows = await db
    .select({
      messageId: speakingFeedbackEvaluations.messageId,

      skill: speakingFeedbackEvaluations.skill,

      score: speakingFeedbackEvaluations.score,

      createdAt: speakingFeedbackEvaluations.createdAt,
    })
    .from(speakingFeedbackEvaluations)
    .innerJoin(speakingMessages, eq(speakingMessages.id, speakingFeedbackEvaluations.messageId))
    .innerJoin(speakingSessions, eq(speakingSessions.id, speakingMessages.sessionId))
    .where(eq(speakingSessions.userId, userId))
    .orderBy(asc(speakingFeedbackEvaluations.createdAt));

  const evaluationRows = rows as EvaluationRow[];

  const grammar = calculateSkillMetric("grammar", evaluationRows);

  const vocabulary = calculateSkillMetric("vocabulary", evaluationRows);

  const fluency = calculateSkillMetric("fluency", evaluationRows);

  const availableAverages = [
    grammar.averageScore,
    vocabulary.averageScore,
    fluency.averageScore,
  ].filter((score): score is number => score !== null);

  const overallScore =
    availableAverages.length > 0
      ? roundScore(
          availableAverages.reduce((sum, score) => sum + score, 0) / availableAverages.length,
        )
      : null;

  const evaluatedMessages = new Set(evaluationRows.map((row) => row.messageId)).size;

  return {
    overallScore,

    totalEvaluations: evaluationRows.length,

    evaluatedMessages,

    pronunciation: {
      available: false,
      score: null,
      reason: "provider_unavailable",
    },

    skills: {
      grammar,
      vocabulary,
      fluency,
    },
  };
}

import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingEvaluations, writingRevisions, writingSessions } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { buildWritingSubmissionHistory, type WritingSubmissionHistoryRow } from "./history";
import type { WritingSubmissionHistory } from "./history-types";
import { calculateWritingSkillMetrics, type WritingMetricEvaluation } from "./metrics";
import { calculateWritingImprovementTrends } from "./trends";
import type { WritingImprovementTrends, WritingTrendPoint } from "./trend-types";
import type { WritingSkillMetrics, WritingSkillScores } from "./types";

export async function getWritingSkillMetrics(userId: string): Promise<WritingSkillMetrics> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const rows = await db
    .select({
      sessionId: writingSessions.id,

      createdAt: writingEvaluations.createdAt,

      overallScore: writingEvaluations.overallScore,
      grammarScore: writingEvaluations.grammarScore,
      vocabularyScore: writingEvaluations.vocabularyScore,
      coherenceScore: writingEvaluations.coherenceScore,
      taskAchievementScore: writingEvaluations.taskAchievementScore,
      mechanicsScore: writingEvaluations.mechanicsScore,
    })
    .from(writingEvaluations)
    .innerJoin(writingRevisions, eq(writingEvaluations.revisionId, writingRevisions.id))
    .innerJoin(writingSessions, eq(writingRevisions.sessionId, writingSessions.id))
    .where(
      and(eq(writingSessions.userId, userId), eq(writingSessions.moduleId, MODULE_IDS.writing)),
    )
    .orderBy(asc(writingEvaluations.createdAt));

  return calculateWritingSkillMetrics(rows satisfies WritingMetricEvaluation[]);
}

export async function getWritingSubmissionHistory(
  userId: string,
): Promise<WritingSubmissionHistory> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const rows = await db
    .select({
      sessionId: writingSessions.id,
      taskId: writingSessions.taskId,
      sessionTitle: writingSessions.title,
      writingType: writingSessions.writingType,
      targetCefrLevel: writingSessions.targetCefrLevel,
      taskSnapshot: writingSessions.taskSnapshot,
      status: writingSessions.status,
      startedAt: writingSessions.startedAt,
      completedAt: writingSessions.completedAt,

      revisionId: writingRevisions.id,
      revisionNumber: writingRevisions.revisionNumber,
      wordCount: writingRevisions.wordCount,
      characterCount: writingRevisions.characterCount,
      revisionCreatedAt: writingRevisions.createdAt,

      evaluationCreatedAt: writingEvaluations.createdAt,
      overallScore: writingEvaluations.overallScore,
      grammarScore: writingEvaluations.grammarScore,
      vocabularyScore: writingEvaluations.vocabularyScore,
      coherenceScore: writingEvaluations.coherenceScore,
      taskAchievementScore: writingEvaluations.taskAchievementScore,
      mechanicsScore: writingEvaluations.mechanicsScore,
    })
    .from(writingEvaluations)
    .innerJoin(writingRevisions, eq(writingEvaluations.revisionId, writingRevisions.id))
    .innerJoin(writingSessions, eq(writingRevisions.sessionId, writingSessions.id))
    .where(
      and(eq(writingSessions.userId, userId), eq(writingSessions.moduleId, MODULE_IDS.writing)),
    )
    .orderBy(desc(writingEvaluations.createdAt));

  return buildWritingSubmissionHistory(rows satisfies WritingSubmissionHistoryRow[]);
}

export async function getWritingImprovementTrends(
  userId: string,
): Promise<WritingImprovementTrends> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const rows = await db
    .select({
      revisionId: writingRevisions.id,
      sessionId: writingSessions.id,
      revisionNumber: writingRevisions.revisionNumber,
      evaluatedAt: writingEvaluations.createdAt,

      overall: writingEvaluations.overallScore,
      grammar: writingEvaluations.grammarScore,
      vocabulary: writingEvaluations.vocabularyScore,
      coherence: writingEvaluations.coherenceScore,
      taskAchievement: writingEvaluations.taskAchievementScore,
      mechanics: writingEvaluations.mechanicsScore,
    })
    .from(writingEvaluations)
    .innerJoin(writingRevisions, eq(writingEvaluations.revisionId, writingRevisions.id))
    .innerJoin(writingSessions, eq(writingRevisions.sessionId, writingSessions.id))
    .where(
      and(eq(writingSessions.userId, userId), eq(writingSessions.moduleId, MODULE_IDS.writing)),
    )
    .orderBy(asc(writingEvaluations.createdAt));

  const history: WritingTrendPoint[] = rows.map((row) => ({
    revisionId: row.revisionId,
    sessionId: row.sessionId,
    revisionNumber: row.revisionNumber,
    evaluatedAt: row.evaluatedAt,

    scores: {
      overall: row.overall,
      grammar: row.grammar,
      vocabulary: row.vocabulary,
      coherence: row.coherence,
      taskAchievement: row.taskAchievement,
      mechanics: row.mechanics,
    } satisfies WritingSkillScores,
  }));

  return calculateWritingImprovementTrends(history);
}

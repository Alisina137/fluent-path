import type {
  WritingSubmissionHistory,
  WritingSubmissionHistoryRevision,
  WritingSubmissionHistorySession,
} from "./history-types";

export interface WritingSubmissionHistoryRow {
  sessionId: string;
  taskId: string | null;
  sessionTitle: string | null;
  writingType: string;
  targetCefrLevel: string;
  taskSnapshot: {
    source: "task" | "custom";
    title: string | null;
    prompt: string | null;
    category: string | null;
    writingType: string;
    cefrLevel: string;
    minWords: number | null;
    maxWords: number | null;
    audience: string | null;
    purpose: string | null;
    tone: string | null;
  };
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  completedAt: Date | null;

  revisionId: string;
  revisionNumber: number;
  wordCount: number;
  characterCount: number;
  revisionCreatedAt: Date;

  evaluationCreatedAt: Date;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  taskAchievementScore: number;
  mechanicsScore: number;
}

function resolveSessionTitle(row: WritingSubmissionHistoryRow): string {
  return row.taskSnapshot.title ?? row.sessionTitle ?? "Free Writing";
}

function toRevision(row: WritingSubmissionHistoryRow): WritingSubmissionHistoryRevision {
  return {
    revisionId: row.revisionId,
    revisionNumber: row.revisionNumber,
    wordCount: row.wordCount,
    characterCount: row.characterCount,
    submittedAt: row.revisionCreatedAt,
    evaluatedAt: row.evaluationCreatedAt,

    scores: {
      overall: row.overallScore,
      grammar: row.grammarScore,
      vocabulary: row.vocabularyScore,
      coherence: row.coherenceScore,
      taskAchievement: row.taskAchievementScore,
      mechanics: row.mechanicsScore,
    },
  };
}

export function buildWritingSubmissionHistory(
  rows: readonly WritingSubmissionHistoryRow[],
): WritingSubmissionHistory {
  const sessions = new Map<string, WritingSubmissionHistorySession>();

  for (const row of rows) {
    let session = sessions.get(row.sessionId);

    if (!session) {
      session = {
        sessionId: row.sessionId,
        taskId: row.taskId,
        title: resolveSessionTitle(row),
        writingType: row.writingType,
        targetCefrLevel: row.targetCefrLevel,
        category: row.taskSnapshot.category,
        status: row.status,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        revisions: [],
      };

      sessions.set(row.sessionId, session);
    }

    session.revisions.push(toRevision(row));
  }

  const historySessions = Array.from(sessions.values());

  for (const session of historySessions) {
    session.revisions.sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime());
  }

  historySessions.sort((a, b) => {
    const aLatest = a.revisions[0]?.evaluatedAt.getTime() ?? 0;

    const bLatest = b.revisions[0]?.evaluatedAt.getTime() ?? 0;

    return bLatest - aLatest;
  });

  return {
    totalEvaluatedRevisions: rows.length,
    totalSessions: historySessions.length,
    sessions: historySessions,
  };
}

import { and, desc, eq, lt, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingDrafts, writingSessions, type WritingSessionStatus } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export interface WritingHistoryCursor {
  startedAt: Date;
  id: string;
}

export interface GetWritingHistoryInput {
  status?: WritingSessionStatus;
  limit?: number;
  cursor?: WritingHistoryCursor;
}

export interface WritingHistoryItem {
  id: string;
  taskId: string | null;
  status: WritingSessionStatus;
  title: string | null;
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
  startedAt: Date;
  lastActivityAt: Date;
  completedAt: Date | null;
  abandonedAt: Date | null;
  draft: {
    wordCount: number;
    characterCount: number;
    lastSavedAt: Date;
  } | null;
}

export interface WritingHistoryPage {
  items: WritingHistoryItem[];
  nextCursor: WritingHistoryCursor | null;
}

export async function getWritingHistory(
  userId: string,
  input: GetWritingHistoryInput = {},
): Promise<WritingHistoryPage> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const requestedLimit = input.limit ?? DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE);

  const conditions = [
    eq(writingSessions.userId, userId),
    eq(writingSessions.moduleId, MODULE_IDS.writing),
  ];

  if (input.status) {
    conditions.push(eq(writingSessions.status, input.status));
  }

  if (input.cursor) {
    conditions.push(
      or(
        lt(writingSessions.startedAt, input.cursor.startedAt),
        and(
          eq(writingSessions.startedAt, input.cursor.startedAt),
          lt(writingSessions.id, input.cursor.id),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      id: writingSessions.id,
      taskId: writingSessions.taskId,
      status: writingSessions.status,
      title: writingSessions.title,
      writingType: writingSessions.writingType,
      targetCefrLevel: writingSessions.targetCefrLevel,
      taskSnapshot: writingSessions.taskSnapshot,
      startedAt: writingSessions.startedAt,
      lastActivityAt: writingSessions.lastActivityAt,
      completedAt: writingSessions.completedAt,
      abandonedAt: writingSessions.abandonedAt,
      draftWordCount: writingDrafts.wordCount,
      draftCharacterCount: writingDrafts.characterCount,
      draftLastSavedAt: writingDrafts.lastSavedAt,
    })
    .from(writingSessions)
    .leftJoin(writingDrafts, eq(writingDrafts.sessionId, writingSessions.id))
    .where(and(...conditions))
    .orderBy(desc(writingSessions.startedAt), desc(writingSessions.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const visibleRows = hasMore ? rows.slice(0, limit) : rows;

  const items: WritingHistoryItem[] = visibleRows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    status: row.status,
    title: row.title,
    writingType: row.writingType,
    targetCefrLevel: row.targetCefrLevel,
    taskSnapshot: row.taskSnapshot,
    startedAt: row.startedAt,
    lastActivityAt: row.lastActivityAt,
    completedAt: row.completedAt,
    abandonedAt: row.abandonedAt,
    draft:
      row.draftLastSavedAt === null
        ? null
        : {
            wordCount: row.draftWordCount ?? 0,
            characterCount: row.draftCharacterCount ?? 0,
            lastSavedAt: row.draftLastSavedAt,
          },
  }));

  const lastItem = visibleRows.at(-1);

  return {
    items,
    nextCursor:
      hasMore && lastItem
        ? {
            startedAt: lastItem.startedAt,
            id: lastItem.id,
          }
        : null,
  };
}

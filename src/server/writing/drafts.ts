import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingDrafts, writingSessions, type WritingDraftRow } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export class WritingDraftNotFoundError extends Error {
  constructor() {
    super("Writing draft not found.");
    this.name = "WritingDraftNotFoundError";
  }
}

export class WritingDraftStateError extends Error {
  constructor(readonly currentStatus: "completed" | "abandoned") {
    super(`Cannot modify a writing draft when its session has status "${currentStatus}".`);

    this.name = "WritingDraftStateError";
  }
}

export interface SaveWritingDraftResult {
  draft: WritingDraftRow;
}

function countWords(content: string): number {
  const normalized = content.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/u).length;
}

function countCharacters(content: string): number {
  return Array.from(content).length;
}

export async function getWritingDraft(userId: string, sessionId: string): Promise<WritingDraftRow> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const [result] = await db
    .select({
      draft: writingDrafts,
    })
    .from(writingDrafts)
    .innerJoin(writingSessions, eq(writingDrafts.sessionId, writingSessions.id))
    .where(
      and(
        eq(writingDrafts.sessionId, sessionId),
        eq(writingSessions.userId, userId),
        eq(writingSessions.moduleId, MODULE_IDS.writing),
      ),
    )
    .limit(1);

  if (!result) {
    throw new WritingDraftNotFoundError();
  }

  return result.draft;
}

export async function saveWritingDraft(
  userId: string,
  sessionId: string,
  content: string,
): Promise<SaveWritingDraftResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [session] = await tx
      .select({
        id: writingSessions.id,
        status: writingSessions.status,
      })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.id, sessionId),
          eq(writingSessions.userId, userId),
          eq(writingSessions.moduleId, MODULE_IDS.writing),
        ),
      )
      .limit(1);

    if (!session) {
      throw new WritingDraftNotFoundError();
    }

    if (session.status !== "active") {
      throw new WritingDraftStateError(session.status);
    }

    const wordCount = countWords(content);
    const characterCount = countCharacters(content);

    const [draft] = await tx
      .update(writingDrafts)
      .set({
        content,
        wordCount,
        characterCount,
        lastSavedAt: now,
        updatedAt: now,
      })
      .where(eq(writingDrafts.sessionId, sessionId))
      .returning();

    if (!draft) {
      throw new WritingDraftNotFoundError();
    }

    await tx
      .update(writingSessions)
      .set({
        lastActivityAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(writingSessions.id, sessionId),
          eq(writingSessions.userId, userId),
          eq(writingSessions.moduleId, MODULE_IDS.writing),
          eq(writingSessions.status, "active"),
        ),
      );

    return {
      draft,
    };
  });
}

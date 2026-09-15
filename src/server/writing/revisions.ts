import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingDrafts, writingRevisions, writingSessions } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export class WritingRevisionError extends Error {
  constructor(
    public readonly code:
      "session_not_found" | "draft_not_found" | "draft_empty" | "revision_creation_failed",
    message: string,
  ) {
    super(message);
    this.name = "WritingRevisionError";
  }
}

export async function createWritingRevision(userId: string, sessionId: string) {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
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
      throw new WritingRevisionError("session_not_found", "Writing session not found.");
    }

    const [draft] = await tx
      .select()
      .from(writingDrafts)
      .where(eq(writingDrafts.sessionId, sessionId))
      .limit(1);

    if (!draft) {
      throw new WritingRevisionError("draft_not_found", "Writing draft not found.");
    }

    if (!draft.content.trim()) {
      throw new WritingRevisionError("draft_empty", "Write something before requesting feedback.");
    }

    const [latestRevision] = await tx
      .select({
        revisionNumber: writingRevisions.revisionNumber,
      })
      .from(writingRevisions)
      .where(eq(writingRevisions.sessionId, sessionId))
      .orderBy(desc(writingRevisions.revisionNumber))
      .limit(1);

    const revisionNumber = (latestRevision?.revisionNumber ?? 0) + 1;

    const [revision] = await tx
      .insert(writingRevisions)
      .values({
        sessionId,
        revisionNumber,
        content: draft.content,
        wordCount: draft.wordCount,
        characterCount: draft.characterCount,
      })
      .returning();

    if (!revision) {
      throw new WritingRevisionError(
        "revision_creation_failed",
        "The writing revision could not be created.",
      );
    }

    return revision;
  });
}

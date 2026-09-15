import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingDrafts, writingEvaluations, writingRevisions, writingSessions } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";
import { compareWritingRevisions } from "@/server/writing/comparison/compare";

import type { WritingRevisionComparisonSide } from "@/server/writing/comparison/types";
import type { WritingDimensionScore } from "@/server/writing/improvement/types";

export class WritingRevisionError extends Error {
  constructor(
    public readonly code:
      | "session_not_found"
      | "session_closed"
      | "draft_not_found"
      | "draft_empty"
      | "revision_creation_failed"
      | "revision_not_found"
      | "invalid_comparison",
    message: string,
  ) {
    super(message);
    this.name = "WritingRevisionError";
  }
}

export interface WritingRevisionResult {
  revision: typeof writingRevisions.$inferSelect;
  created: boolean;
}

export async function createOrReuseWritingRevision(
  userId: string,
  sessionId: string,
): Promise<WritingRevisionResult> {
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

    if (session.status !== "active") {
      throw new WritingRevisionError(
        "session_closed",
        "Only an active writing session can create a new revision.",
      );
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
      .select()
      .from(writingRevisions)
      .where(eq(writingRevisions.sessionId, sessionId))
      .orderBy(desc(writingRevisions.revisionNumber))
      .limit(1);

    if (latestRevision && latestRevision.content === draft.content) {
      return {
        revision: latestRevision,
        created: false,
      };
    }

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

    return {
      revision,
      created: true,
    };
  });
}

export async function compareOwnedWritingRevisions(
  userId: string,
  sessionId: string,
  beforeRevisionId: string,
  afterRevisionId: string,
) {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  if (beforeRevisionId === afterRevisionId) {
    throw new WritingRevisionError(
      "invalid_comparison",
      "Choose two different writing revisions to compare.",
    );
  }

  const db = getDb();

  const [session] = await db
    .select({
      id: writingSessions.id,
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
    throw new WritingRevisionError("session_not_found", "Writing session not found.");
  }

  const revisions = await db
    .select({
      id: writingRevisions.id,
      revisionNumber: writingRevisions.revisionNumber,
      content: writingRevisions.content,
      wordCount: writingRevisions.wordCount,
      characterCount: writingRevisions.characterCount,
      createdAt: writingRevisions.createdAt,

      overallScore: writingEvaluations.overallScore,
      grammarScore: writingEvaluations.grammarScore,
      vocabularyScore: writingEvaluations.vocabularyScore,
      coherenceScore: writingEvaluations.coherenceScore,
      taskAchievementScore: writingEvaluations.taskAchievementScore,
      mechanicsScore: writingEvaluations.mechanicsScore,
    })
    .from(writingRevisions)
    .leftJoin(writingEvaluations, eq(writingEvaluations.revisionId, writingRevisions.id))
    .where(
      and(
        eq(writingRevisions.sessionId, sessionId),
        inArray(writingRevisions.id, [beforeRevisionId, afterRevisionId]),
      ),
    );

  if (revisions.length !== 2) {
    throw new WritingRevisionError(
      "revision_not_found",
      "One or more writing revisions could not be found.",
    );
  }

  const beforeRevision = revisions.find((revision) => revision.id === beforeRevisionId);

  const afterRevision = revisions.find((revision) => revision.id === afterRevisionId);

  if (!beforeRevision || !afterRevision) {
    throw new WritingRevisionError(
      "revision_not_found",
      "One or more writing revisions could not be found.",
    );
  }

  if (beforeRevision.revisionNumber >= afterRevision.revisionNumber) {
    throw new WritingRevisionError(
      "invalid_comparison",
      "The before revision must be older than the after revision.",
    );
  }

  const before: WritingRevisionComparisonSide = {
    id: beforeRevision.id,
    revisionNumber: beforeRevision.revisionNumber,
    content: beforeRevision.content,
    wordCount: beforeRevision.wordCount,
    characterCount: beforeRevision.characterCount,
    createdAt: beforeRevision.createdAt,
    overallScore: beforeRevision.overallScore,
    dimensionScores: createDimensionScores({
      overallScore: beforeRevision.overallScore,
      grammarScore: beforeRevision.grammarScore,
      vocabularyScore: beforeRevision.vocabularyScore,
      coherenceScore: beforeRevision.coherenceScore,
      taskAchievementScore: beforeRevision.taskAchievementScore,
      mechanicsScore: beforeRevision.mechanicsScore,
    }),
  };

  const after: WritingRevisionComparisonSide = {
    id: afterRevision.id,
    revisionNumber: afterRevision.revisionNumber,
    content: afterRevision.content,
    wordCount: afterRevision.wordCount,
    characterCount: afterRevision.characterCount,
    createdAt: afterRevision.createdAt,
    overallScore: afterRevision.overallScore,
    dimensionScores: createDimensionScores({
      overallScore: afterRevision.overallScore,
      grammarScore: afterRevision.grammarScore,
      vocabularyScore: afterRevision.vocabularyScore,
      coherenceScore: afterRevision.coherenceScore,
      taskAchievementScore: afterRevision.taskAchievementScore,
      mechanicsScore: afterRevision.mechanicsScore,
    }),
  };

  return compareWritingRevisions(before, after);
}

interface EvaluationScores {
  overallScore: number | null;
  grammarScore: number | null;
  vocabularyScore: number | null;
  coherenceScore: number | null;
  taskAchievementScore: number | null;
  mechanicsScore: number | null;
}

function createDimensionScores({
  overallScore,
  grammarScore,
  vocabularyScore,
  coherenceScore,
  taskAchievementScore,
  mechanicsScore,
}: EvaluationScores): WritingDimensionScore[] {
  if (
    overallScore === null ||
    grammarScore === null ||
    vocabularyScore === null ||
    coherenceScore === null ||
    taskAchievementScore === null ||
    mechanicsScore === null
  ) {
    return [];
  }

  return [
    {
      dimension: "grammar",
      score: grammarScore,
    },
    {
      dimension: "vocabulary",
      score: vocabularyScore,
    },
    {
      dimension: "coherence",
      score: coherenceScore,
    },
    {
      dimension: "taskAchievement",
      score: taskAchievementScore,
    },
    {
      dimension: "mechanics",
      score: mechanicsScore,
    },
  ];
}

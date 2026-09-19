import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  writingEvaluations,
  writingRevisions,
  writingSessions,
  type WritingEvaluationRow,
} from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { getWritingEvaluationProviderId } from "./config";
import { WritingEvaluationError } from "./errors";
import { getWritingEvaluationProvider } from "./provider-registry";
import { ensureWritingEvaluationProvidersRegistered } from "./providers";
import { requireWritingCefrLevel } from "./scoring/cefr";
import type {
  WritingEvaluationRequest,
  WritingEvaluationResult,
  WritingEvaluationTaskContext,
} from "./types";

const MAX_WRITING_EVALUATION_CHARACTERS = 20_000;

const inFlightEvaluations = new Map<
  string,
  Promise<WritingEvaluationResult | WritingEvaluationRow>
>();

interface OwnedRevisionContext {
  revision: typeof writingRevisions.$inferSelect;
  session: typeof writingSessions.$inferSelect;
}

export interface PreparedWritingEvaluation {
  existingEvaluation: WritingEvaluationRow | null;
  request: WritingEvaluationRequest;
}

async function getOwnedRevisionContext(
  userId: string,
  revisionId: string,
): Promise<OwnedRevisionContext> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const [result] = await db
    .select({
      revision: writingRevisions,
      session: writingSessions,
    })
    .from(writingRevisions)
    .innerJoin(writingSessions, eq(writingRevisions.sessionId, writingSessions.id))
    .where(
      and(
        eq(writingRevisions.id, revisionId),
        eq(writingSessions.userId, userId),
        eq(writingSessions.moduleId, MODULE_IDS.writing),
      ),
    )
    .limit(1);

  if (!result) {
    throw new WritingEvaluationError({
      code: "revision_not_found",
      message: "Writing revision not found.",
    });
  }

  return result;
}

function buildTaskContext(session: OwnedRevisionContext["session"]): WritingEvaluationTaskContext {
  const snapshot = session.taskSnapshot;

  return {
    source: snapshot.source,
    title: snapshot.title,
    prompt: snapshot.prompt,
    category: snapshot.category,
    writingType: snapshot.writingType,
    targetCefrLevel: requireWritingCefrLevel(snapshot.cefrLevel),
    minWords: snapshot.minWords,
    maxWords: snapshot.maxWords,
    audience: snapshot.audience,
    purpose: snapshot.purpose,
    tone: snapshot.tone,
  };
}

export async function prepareWritingEvaluation(
  userId: string,
  revisionId: string,
): Promise<PreparedWritingEvaluation> {
  const context = await getOwnedRevisionContext(userId, revisionId);

  if (!context.revision.content.trim()) {
    throw new WritingEvaluationError({
      code: "revision_empty",
      message: "An empty writing revision cannot be evaluated.",
    });
  }

  if (context.revision.content.length > MAX_WRITING_EVALUATION_CHARACTERS) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The writing revision is too long to evaluate.",
      retryable: false,
    });
  }

  const db = getDb();

  const [existingEvaluation] = await db
    .select()
    .from(writingEvaluations)
    .where(eq(writingEvaluations.revisionId, revisionId))
    .limit(1);

  return {
    existingEvaluation: existingEvaluation ?? null,

    request: {
      revision: {
        id: context.revision.id,
        revisionNumber: context.revision.revisionNumber,
        content: context.revision.content,
        wordCount: context.revision.wordCount,
        characterCount: context.revision.characterCount,
      },

      task: buildTaskContext(context.session),
    },
  };
}

async function performWritingEvaluation(
  revisionId: string,
  prepared: PreparedWritingEvaluation,
): Promise<WritingEvaluationResult | WritingEvaluationRow> {
  ensureWritingEvaluationProvidersRegistered();

  const providerId = getWritingEvaluationProviderId();
  const provider = getWritingEvaluationProvider(providerId);

  const result = await provider.evaluate(prepared.request);

  const {
    overallScore,
    provider: providerName,
    model,
    providerRequestId,
    ...providerEvaluation
  } = result;

  const db = getDb();

  try {
    const [stored] = await db
      .insert(writingEvaluations)
      .values({
        revisionId,
        overallScore,
        grammarScore: providerEvaluation.dimensions.grammar.score,
        vocabularyScore: providerEvaluation.dimensions.vocabulary.score,
        coherenceScore: providerEvaluation.dimensions.coherence.score,
        taskAchievementScore: providerEvaluation.dimensions.taskAchievement.score,
        mechanicsScore: providerEvaluation.dimensions.mechanics.score,
        evaluation: providerEvaluation,
        provider: providerName,
        model,
        providerRequestId,
      })
      .onConflictDoNothing({
        target: writingEvaluations.revisionId,
      })
      .returning();

    if (stored) {
      return stored;
    }

    const [existing] = await db
      .select()
      .from(writingEvaluations)
      .where(eq(writingEvaluations.revisionId, revisionId))
      .limit(1);

    if (existing) {
      return existing;
    }

    throw new WritingEvaluationError({
      code: "evaluation_unavailable",
      message: "The writing evaluation could not be saved.",
      retryable: true,
    });
  } catch (error) {
    if (error instanceof WritingEvaluationError) {
      throw error;
    }

    throw new WritingEvaluationError({
      code: "evaluation_unavailable",
      message: "The writing evaluation could not be saved.",
      retryable: true,
      cause: error,
    });
  }
}

export async function evaluateWritingRevision(
  userId: string,
  revisionId: string,
): Promise<WritingEvaluationResult | WritingEvaluationRow> {
  const prepared = await prepareWritingEvaluation(userId, revisionId);

  if (prepared.existingEvaluation) {
    return prepared.existingEvaluation;
  }

  const existingRequest = inFlightEvaluations.get(revisionId);

  if (existingRequest) {
    return existingRequest;
  }

  const evaluationPromise = performWritingEvaluation(revisionId, prepared);

  inFlightEvaluations.set(revisionId, evaluationPromise);

  try {
    return await evaluationPromise;
  } finally {
    if (inFlightEvaluations.get(revisionId) === evaluationPromise) {
      inFlightEvaluations.delete(revisionId);
    }
  }
}

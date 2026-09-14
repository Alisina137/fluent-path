import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  speakingFeedbackEvaluations,
  speakingMessages,
  speakingSessions,
  type SpeakingFeedbackSkill,
} from "@/db/schema";

import type { FluencyEvaluation } from "./fluency/types";
import type { GrammarEvaluation } from "./grammar/types";
import type { VocabularyEvaluation } from "./vocabulary/types";

export type SpeakingFeedbackEvaluation =
  GrammarEvaluation | VocabularyEvaluation | FluencyEvaluation;

export type PersistSpeakingFeedbackInput = {
  userId: string;
  sessionId: string;
  messageId: string;
  skill: SpeakingFeedbackSkill;
  score: number;
  evaluation: SpeakingFeedbackEvaluation;
  provider: string;
  model: string;
  providerRequestId: string | null;
};

export type PersistedSpeakingFeedback = {
  id: string;
  messageId: string;
  skill: SpeakingFeedbackSkill;
  score: number;
  evaluation: SpeakingFeedbackEvaluation;
  provider: string;
  model: string;
  providerRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) {
    throw new Error("Speaking feedback score must be a finite number.");
  }

  const normalized = Math.round(score);

  if (normalized < 0 || normalized > 100) {
    throw new Error("Speaking feedback score must be between 0 and 100.");
  }

  return normalized;
}

async function verifyLearnerMessageOwnership(
  userId: string,
  sessionId: string,
  messageId: string,
): Promise<void> {
  const db = getDb();

  const [message] = await db
    .select({
      id: speakingMessages.id,
      role: speakingMessages.role,
    })
    .from(speakingMessages)
    .innerJoin(speakingSessions, eq(speakingSessions.id, speakingMessages.sessionId))
    .where(
      and(
        eq(speakingMessages.id, messageId),
        eq(speakingMessages.sessionId, sessionId),
        eq(speakingSessions.userId, userId),
      ),
    )
    .limit(1);

  if (!message) {
    throw new Error("Speaking learner message could not be found.");
  }

  if (message.role !== "user") {
    throw new Error("Speaking feedback can only be persisted for learner messages.");
  }
}

function toPersistedSpeakingFeedback(
  row: typeof speakingFeedbackEvaluations.$inferSelect,
): PersistedSpeakingFeedback {
  return {
    ...row,
    skill: row.skill,
    evaluation: row.evaluation as SpeakingFeedbackEvaluation,
  };
}

export async function getPersistedSpeakingFeedback(
  userId: string,
  sessionId: string,
  messageId: string,
  skill: SpeakingFeedbackSkill,
): Promise<PersistedSpeakingFeedback | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: speakingFeedbackEvaluations.id,
      messageId: speakingFeedbackEvaluations.messageId,
      skill: speakingFeedbackEvaluations.skill,
      score: speakingFeedbackEvaluations.score,
      evaluation: speakingFeedbackEvaluations.evaluation,
      provider: speakingFeedbackEvaluations.provider,
      model: speakingFeedbackEvaluations.model,
      providerRequestId: speakingFeedbackEvaluations.providerRequestId,
      createdAt: speakingFeedbackEvaluations.createdAt,
      updatedAt: speakingFeedbackEvaluations.updatedAt,
    })
    .from(speakingFeedbackEvaluations)
    .innerJoin(speakingMessages, eq(speakingMessages.id, speakingFeedbackEvaluations.messageId))
    .innerJoin(speakingSessions, eq(speakingSessions.id, speakingMessages.sessionId))
    .where(
      and(
        eq(speakingFeedbackEvaluations.messageId, messageId),
        eq(speakingFeedbackEvaluations.skill, skill),
        eq(speakingMessages.sessionId, sessionId),
        eq(speakingSessions.userId, userId),
      ),
    )
    .limit(1);

  return row ? toPersistedSpeakingFeedback(row) : null;
}

export async function persistSpeakingFeedback(
  input: PersistSpeakingFeedbackInput,
): Promise<PersistedSpeakingFeedback> {
  await verifyLearnerMessageOwnership(input.userId, input.sessionId, input.messageId);

  const db = getDb();
  const score = normalizeScore(input.score);
  const now = new Date();

  const inserted = await db
    .insert(speakingFeedbackEvaluations)
    .values({
      messageId: input.messageId,
      skill: input.skill,
      score,
      evaluation: input.evaluation,
      provider: input.provider,
      model: input.model,
      providerRequestId: input.providerRequestId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [speakingFeedbackEvaluations.messageId, speakingFeedbackEvaluations.skill],
    })
    .returning();

  if (inserted[0]) {
    return toPersistedSpeakingFeedback(inserted[0]);
  }

  const existing = await getPersistedSpeakingFeedback(
    input.userId,
    input.sessionId,
    input.messageId,
    input.skill,
  );

  if (!existing) {
    throw new Error("Unable to persist speaking feedback.");
  }

  return existing;
}

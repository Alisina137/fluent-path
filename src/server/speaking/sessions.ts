import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { speakingSessions } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export type SpeakingSession = typeof speakingSessions.$inferSelect;

export class SpeakingSessionNotFoundError extends Error {
  constructor() {
    super("Speaking session not found.");
    this.name = "SpeakingSessionNotFoundError";
  }
}

export class SpeakingSessionStateError extends Error {
  constructor(
    readonly currentStatus: SpeakingSession["status"],
    readonly requestedAction: string,
  ) {
    super(`Cannot ${requestedAction} a speaking session with status "${currentStatus}".`);

    this.name = "SpeakingSessionStateError";
  }
}

async function findActiveSpeakingSession(userId: string): Promise<SpeakingSession | null> {
  const db = getDb();

  const [session] = await db
    .select()
    .from(speakingSessions)
    .where(
      and(
        eq(speakingSessions.userId, userId),
        eq(speakingSessions.moduleId, MODULE_IDS.speaking),
        eq(speakingSessions.status, "active"),
      ),
    )
    .orderBy(desc(speakingSessions.startedAt))
    .limit(1);

  return session ?? null;
}

export async function startSpeakingSession(userId: string): Promise<SpeakingSession> {
  await requireServerModuleAccess(userId, MODULE_IDS.speaking);

  const existingSession = await findActiveSpeakingSession(userId);

  if (existingSession) {
    return existingSession;
  }

  const db = getDb();
  const now = new Date();

  const inserted = await db
    .insert(speakingSessions)
    .values({
      userId,
      moduleId: MODULE_IDS.speaking,
      status: "active",
      startedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) {
    return inserted[0];
  }

  const concurrentSession = await findActiveSpeakingSession(userId);

  if (!concurrentSession) {
    throw new Error("Unable to create speaking session.");
  }

  return concurrentSession;
}

export async function getSpeakingSession(
  userId: string,
  sessionId: string,
): Promise<SpeakingSession> {
  const db = getDb();

  const [session] = await db
    .select()
    .from(speakingSessions)
    .where(
      and(
        eq(speakingSessions.id, sessionId),
        eq(speakingSessions.userId, userId),
        eq(speakingSessions.moduleId, MODULE_IDS.speaking),
      ),
    )
    .limit(1);

  if (!session) {
    throw new SpeakingSessionNotFoundError();
  }

  return session;
}

export async function getActiveSpeakingSession(userId: string): Promise<SpeakingSession | null> {
  await requireServerModuleAccess(userId, MODULE_IDS.speaking);

  return findActiveSpeakingSession(userId);
}

export async function touchSpeakingSession(
  userId: string,
  sessionId: string,
): Promise<SpeakingSession> {
  const db = getDb();
  const now = new Date();

  const [session] = await db
    .update(speakingSessions)
    .set({
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(speakingSessions.id, sessionId),
        eq(speakingSessions.userId, userId),
        eq(speakingSessions.status, "active"),
      ),
    )
    .returning();

  if (session) {
    return session;
  }

  const existing = await getSpeakingSession(userId, sessionId);

  throw new SpeakingSessionStateError(existing.status, "update");
}

async function closeSpeakingSession(
  userId: string,
  sessionId: string,
  status: "completed" | "abandoned" | "failed",
): Promise<SpeakingSession> {
  const db = getDb();
  const current = await getSpeakingSession(userId, sessionId);

  if (current.status !== "active") {
    throw new SpeakingSessionStateError(current.status, status);
  }

  const now = new Date();

  const durationMs = Math.max(0, now.getTime() - current.startedAt.getTime());

  const lifecycleTimestamp =
    status === "completed"
      ? { completedAt: now }
      : status === "abandoned"
        ? { abandonedAt: now }
        : { failedAt: now };

  const [updated] = await db
    .update(speakingSessions)
    .set({
      status,
      durationMs,
      lastActivityAt: now,
      updatedAt: now,
      ...lifecycleTimestamp,
    })
    .where(
      and(
        eq(speakingSessions.id, sessionId),
        eq(speakingSessions.userId, userId),
        eq(speakingSessions.status, "active"),
      ),
    )
    .returning();

  if (!updated) {
    const latest = await getSpeakingSession(userId, sessionId);

    throw new SpeakingSessionStateError(latest.status, status);
  }

  return updated;
}

export function completeSpeakingSession(
  userId: string,
  sessionId: string,
): Promise<SpeakingSession> {
  return closeSpeakingSession(userId, sessionId, "completed");
}

export function abandonSpeakingSession(
  userId: string,
  sessionId: string,
): Promise<SpeakingSession> {
  return closeSpeakingSession(userId, sessionId, "abandoned");
}

export function failSpeakingSession(userId: string, sessionId: string): Promise<SpeakingSession> {
  return closeSpeakingSession(userId, sessionId, "failed");
}

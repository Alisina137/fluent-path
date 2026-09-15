import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingDrafts, writingSessions, writingTasks, type WritingSessionRow } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export type WritingTaskSnapshot = WritingSessionRow["taskSnapshot"];

export interface StartWritingSessionInput {
  taskId?: string;
  title?: string;
  writingType?: string;
  targetCefrLevel?: string;
  prompt?: string;
}

export class WritingSessionNotFoundError extends Error {
  constructor() {
    super("Writing session not found.");
    this.name = "WritingSessionNotFoundError";
  }
}

export class WritingTaskNotFoundError extends Error {
  constructor() {
    super("Writing task not found.");
    this.name = "WritingTaskNotFoundError";
  }
}

export class WritingSessionStateError extends Error {
  constructor(
    readonly currentStatus: WritingSessionRow["status"],
    readonly requestedAction: string,
  ) {
    super(`Cannot ${requestedAction} a writing session with status "${currentStatus}".`);

    this.name = "WritingSessionStateError";
  }
}

export class InvalidCustomWritingSessionError extends Error {
  constructor() {
    super("Custom writing requires a writing type and target CEFR level.");
    this.name = "InvalidCustomWritingSessionError";
  }
}

async function buildTaskSessionContext(taskId: string): Promise<{
  taskId: string;
  title: string;
  writingType: string;
  targetCefrLevel: string;
  snapshot: WritingTaskSnapshot;
}> {
  const db = getDb();

  const [task] = await db
    .select()
    .from(writingTasks)
    .where(and(eq(writingTasks.id, taskId), eq(writingTasks.isActive, 1)))
    .limit(1);

  if (!task) {
    throw new WritingTaskNotFoundError();
  }

  return {
    taskId: task.id,
    title: task.title,
    writingType: task.writingType,
    targetCefrLevel: task.cefrLevel,
    snapshot: {
      source: "task",
      title: task.title,
      prompt: task.prompt,
      category: task.category,
      writingType: task.writingType,
      cefrLevel: task.cefrLevel,
      minWords: task.minWords,
      maxWords: task.maxWords,
      audience: task.audience,
      purpose: task.purpose,
      tone: task.tone,
    },
  };
}

function buildCustomSessionContext(input: StartWritingSessionInput): {
  taskId: null;
  title: string | null;
  writingType: string;
  targetCefrLevel: string;
  snapshot: WritingTaskSnapshot;
} {
  const writingType = input.writingType?.trim();
  const targetCefrLevel = input.targetCefrLevel?.trim();

  if (!writingType || !targetCefrLevel) {
    throw new InvalidCustomWritingSessionError();
  }

  const title = input.title?.trim() || null;
  const prompt = input.prompt?.trim() || null;

  return {
    taskId: null,
    title,
    writingType,
    targetCefrLevel,
    snapshot: {
      source: "custom",
      title,
      prompt,
      category: null,
      writingType,
      cefrLevel: targetCefrLevel,
      minWords: null,
      maxWords: null,
      audience: null,
      purpose: null,
      tone: null,
    },
  };
}

export async function startWritingSession(
  userId: string,
  input: StartWritingSessionInput,
): Promise<WritingSessionRow> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const context = input.taskId
    ? await buildTaskSessionContext(input.taskId)
    : buildCustomSessionContext(input);

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [session] = await tx
      .insert(writingSessions)
      .values({
        userId,
        moduleId: MODULE_IDS.writing,
        taskId: context.taskId,
        status: "active",
        title: context.title,
        writingType: context.writingType,
        targetCefrLevel: context.targetCefrLevel,
        taskSnapshot: context.snapshot,
        startedAt: now,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!session) {
      throw new Error("Unable to create writing session.");
    }

    await tx.insert(writingDrafts).values({
      sessionId: session.id,
      content: "",
      wordCount: 0,
      characterCount: 0,
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return session;
  });
}

export async function getWritingSession(
  userId: string,
  sessionId: string,
): Promise<WritingSessionRow> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const [session] = await db
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
    throw new WritingSessionNotFoundError();
  }

  return session;
}

async function closeWritingSession(
  userId: string,
  sessionId: string,
  status: "completed" | "abandoned",
): Promise<WritingSessionRow> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const current = await getWritingSession(userId, sessionId);

  if (current.status !== "active") {
    throw new WritingSessionStateError(current.status, status);
  }

  const db = getDb();
  const now = new Date();

  const lifecycleTimestamp = status === "completed" ? { completedAt: now } : { abandonedAt: now };

  const [updated] = await db
    .update(writingSessions)
    .set({
      status,
      lastActivityAt: now,
      updatedAt: now,
      ...lifecycleTimestamp,
    })
    .where(
      and(
        eq(writingSessions.id, sessionId),
        eq(writingSessions.userId, userId),
        eq(writingSessions.moduleId, MODULE_IDS.writing),
        eq(writingSessions.status, "active"),
      ),
    )
    .returning();

  if (!updated) {
    const latest = await getWritingSession(userId, sessionId);

    throw new WritingSessionStateError(latest.status, status);
  }

  return updated;
}

export function completeWritingSession(
  userId: string,
  sessionId: string,
): Promise<WritingSessionRow> {
  return closeWritingSession(userId, sessionId, "completed");
}

export function abandonWritingSession(
  userId: string,
  sessionId: string,
): Promise<WritingSessionRow> {
  return closeWritingSession(userId, sessionId, "abandoned");
}

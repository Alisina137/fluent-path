import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { speakingMessages } from "@/db/schema";

import { getSpeakingSession, SpeakingSessionStateError, touchSpeakingSession } from "./sessions";

export type SpeakingMessage = typeof speakingMessages.$inferSelect;

const MAX_MESSAGE_LENGTH = 10_000;

export class SpeakingMessageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpeakingMessageValidationError";
  }
}

function normalizeMessageContent(content: string): string {
  const normalized = content.trim();

  if (!normalized) {
    throw new SpeakingMessageValidationError("Speaking message cannot be empty.");
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    throw new SpeakingMessageValidationError(
      `Speaking message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
    );
  }

  return normalized;
}

async function requireActiveSpeakingSession(userId: string, sessionId: string) {
  const session = await getSpeakingSession(userId, sessionId);

  if (session.status !== "active") {
    throw new SpeakingSessionStateError(session.status, "add conversation messages to");
  }

  return session;
}

async function insertSpeakingMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
): Promise<SpeakingMessage> {
  const db = getDb();

  const [message] = await db
    .insert(speakingMessages)
    .values({
      sessionId,
      role,
      content,
    })
    .returning();

  if (!message) {
    throw new Error("Unable to persist speaking message.");
  }

  return message;
}

export async function addUserSpeakingMessage(
  userId: string,
  sessionId: string,
  content: string,
): Promise<SpeakingMessage> {
  await requireActiveSpeakingSession(userId, sessionId);

  const normalizedContent = normalizeMessageContent(content);

  const message = await insertSpeakingMessage(sessionId, "user", normalizedContent);

  await touchSpeakingSession(userId, sessionId);

  return message;
}

export async function addAssistantSpeakingMessage(
  userId: string,
  sessionId: string,
  content: string,
): Promise<SpeakingMessage> {
  await requireActiveSpeakingSession(userId, sessionId);

  const normalizedContent = normalizeMessageContent(content);

  const message = await insertSpeakingMessage(sessionId, "assistant", normalizedContent);

  await touchSpeakingSession(userId, sessionId);

  return message;
}

export async function getSpeakingConversation(
  userId: string,
  sessionId: string,
): Promise<SpeakingMessage[]> {
  await getSpeakingSession(userId, sessionId);

  const db = getDb();

  return db
    .select()
    .from(speakingMessages)
    .where(eq(speakingMessages.sessionId, sessionId))
    .orderBy(asc(speakingMessages.createdAt), asc(speakingMessages.id));
}

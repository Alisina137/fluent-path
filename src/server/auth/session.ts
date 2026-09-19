import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { getCookie, setCookie, setResponseHeader } from "@tanstack/react-start/server";

import { getDb } from "@/db/client";
import { authSessions } from "@/db/schema";

const SESSION_COOKIE_NAME = "fluent_path_session";
const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const SESSION_LIFETIME_MS = SESSION_LIFETIME_SECONDS * 1000;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface CreatedAuthSession {
  token: string;
  expiresAt: Date;
}

export async function createAuthSession(userId: string): Promise<CreatedAuthSession> {
  const db = getDb();

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  await db.insert(authSessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return {
    token,
    expiresAt,
  };
}

export async function resolveAuthSession(token: string): Promise<string | null> {
  if (!token) {
    return null;
  }

  const db = getDb();
  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const [session] = await db
    .select({
      id: authSessions.id,
      userId: authSessions.userId,
    })
    .from(authSessions)
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, now)))
    .limit(1);

  if (!session) {
    return null;
  }

  await db
    .update(authSessions)
    .set({
      lastUsedAt: now,
    })
    .where(eq(authSessions.id, session.id));

  return session.userId;
}

export async function revokeAuthSession(token: string): Promise<void> {
  if (!token) {
    return;
  }

  const db = getDb();

  await db.delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(token)));
}

export function readAuthSessionToken(): string | null {
  return getCookie(SESSION_COOKIE_NAME) ?? null;
}

export function setAuthSessionCookie(token: string): void {
  setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

export function clearAuthSessionCookie(): void {
  setCookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = readAuthSessionToken();

  if (!token) {
    return null;
  }

  return resolveAuthSession(token);
}

export async function requireAuthenticatedUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("Authentication required.");
  }

  setResponseHeader("Cache-Control", "private, no-store");

  return userId;
}

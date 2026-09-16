import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { userModules, users } from "@/db/schema";

export interface DevelopmentUser {
  id: string;
  email: string;
  name: string;
}

export async function ensureDevelopmentUser(user: DevelopmentUser): Promise<void> {
  const db = getDb();

  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    .onConflictDoNothing();
}

export async function listDevelopmentUserModules(userId: string) {
  const db = getDb();

  return db.select().from(userModules).where(eq(userModules.userId, userId));
}

export async function activateDevelopmentModule(user: DevelopmentUser, moduleId: string) {
  await ensureDevelopmentUser(user);

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [result] = await db
    .insert(userModules)
    .values({
      userId: user.id,
      moduleId,
      accessStatus: "active",
      accessSource: "development",
      activatedAt: now,
      expiresAt,
      lastAccessedAt: null,
      progressPercentage: 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userModules.userId, userModules.moduleId],
      set: {
        accessStatus: "active",
        accessSource: "development",
        activatedAt: now,
        expiresAt,
        updatedAt: now,
      },
    })
    .returning();

  return result;
}

export async function cancelDevelopmentModule(userId: string, moduleId: string) {
  const db = getDb();
  const now = new Date();

  const [result] = await db
    .update(userModules)
    .set({
      accessStatus: "canceled",
      updatedAt: now,
    })
    .where(and(eq(userModules.userId, userId), eq(userModules.moduleId, moduleId)))
    .returning();

  return result ?? null;
}

export async function markDevelopmentModuleOpened(userId: string, moduleId: string) {
  const db = getDb();
  const now = new Date();

  const [result] = await db
    .update(userModules)
    .set({
      lastAccessedAt: now,
      updatedAt: now,
    })
    .where(and(eq(userModules.userId, userId), eq(userModules.moduleId, moduleId)))
    .returning();

  return result ?? null;
}

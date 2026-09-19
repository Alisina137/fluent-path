import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { userCredentials, userLanguageSettings, userProfiles, users } from "@/db/schema";

const PASSWORD_HASH_ROUNDS = 12;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
  onboardingCompleted: boolean;
}

export interface SignUpAccountInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInAccountInput {
  email: string;
  password: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapAuthenticatedUser(
  user: typeof users.$inferSelect,
  onboardingCompleted: boolean,
): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatarUrl,
    createdAt: user.createdAt,
    onboardingCompleted,
  };
}

export async function createAccount(input: SignUpAccountInput): Promise<AuthenticatedUser> {
  const db = getDb();

  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  const [existingUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

  return db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        email,
        name,
      })
      .returning();

    if (!createdUser) {
      throw new Error("The account could not be created.");
    }

    await tx.insert(userCredentials).values({
      userId: createdUser.id,
      passwordHash,
    });

    await tx.insert(userProfiles).values({
      userId: createdUser.id,
    });

    await tx.insert(userLanguageSettings).values({
      userId: createdUser.id,
    });

    return mapAuthenticatedUser(createdUser, false);
  });
}

export async function authenticateAccount(input: SignInAccountInput): Promise<AuthenticatedUser> {
  const db = getDb();
  const email = normalizeEmail(input.email);

  const [account] = await db
    .select({
      user: users,
      passwordHash: userCredentials.passwordHash,
      onboardingCompleted: userProfiles.onboardingCompleted,
    })
    .from(users)
    .innerJoin(userCredentials, eq(userCredentials.userId, users.id))
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);

  if (!account) {
    throw new Error("Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(input.password, account.passwordHash);

  if (!passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  return mapAuthenticatedUser(account.user, account.onboardingCompleted);
}

export async function getAuthenticatedAccountById(
  userId: string,
): Promise<AuthenticatedUser | null> {
  const db = getDb();

  const [account] = await db
    .select({
      user: users,
      onboardingCompleted: userProfiles.onboardingCompleted,
    })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    return null;
  }

  return mapAuthenticatedUser(account.user, account.onboardingCompleted);
}

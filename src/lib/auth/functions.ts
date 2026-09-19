import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(320);
const passwordSchema = z.string().min(6).max(128);

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: emailSchema,
  password: passwordSchema,
});

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

async function establishSession(userId: string): Promise<void> {
  const { createAuthSession, setAuthSessionCookie } = await import("@/server/auth/session");
  const session = await createAuthSession(userId);
  setAuthSessionCookie(session.token);
}

export const signUpServerFn = createServerFn({
  method: "POST",
})
  .validator(signUpSchema)
  .handler(async ({ data }) => {
    const { createAccount } = await import("@/server/auth/accounts");

    const user = await createAccount(data);

    await establishSession(user.id);

    return user;
  });

export const signInServerFn = createServerFn({
  method: "POST",
})
  .validator(signInSchema)
  .handler(async ({ data }) => {
    const { authenticateAccount } = await import("@/server/auth/accounts");

    const user = await authenticateAccount(data);
    await establishSession(user.id);
    return user;
  });

export const getCurrentAccountServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getAuthenticatedUserId } = await import("@/server/auth/session");

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { getAuthenticatedAccountById } = await import("@/server/auth/accounts");

  return getAuthenticatedAccountById(userId);
});

export const signOutServerFn = createServerFn({
  method: "POST",
}).handler(async () => {
  const { clearAuthSessionCookie, readAuthSessionToken, revokeAuthSession } =
    await import("@/server/auth/session");

  const token = readAuthSessionToken();

  if (token) {
    await revokeAuthSession(token);
  }

  clearAuthSessionCookie();

  return {
    success: true,
  };
});

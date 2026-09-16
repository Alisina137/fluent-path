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

export const signUpServerFn = createServerFn({
  method: "POST",
})
  .validator(signUpSchema)
  .handler(async ({ data }) => {
    const { createAccount } = await import("@/server/auth/accounts");

    return createAccount(data);
  });

export const signInServerFn = createServerFn({
  method: "POST",
})
  .validator(signInSchema)
  .handler(async ({ data }) => {
    const { authenticateAccount } = await import("@/server/auth/accounts");

    return authenticateAccount(data);
  });

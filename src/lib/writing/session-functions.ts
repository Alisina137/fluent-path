import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  abandonWritingSession,
  completeWritingSession,
  startWritingSession,
} from "@/server/writing/sessions";

const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const startWritingSessionInputSchema = z
  .object({
    taskId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(200).optional(),
    writingType: z.string().trim().min(1).max(100).optional(),
    targetCefrLevel: cefrLevelSchema.optional(),
    prompt: z.string().trim().max(10_000).optional(),
  })
  .refine((data) => Boolean(data.taskId || data.title || data.writingType || data.prompt), {
    message: "A writing task or custom writing details are required.",
  });

const writingSessionInputSchema = z.object({
  sessionId: z.string().uuid(),
});

export const startWritingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(startWritingSessionInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return startWritingSession(userId, data);
  });

export const completeWritingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(writingSessionInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return completeWritingSession(userId, data.sessionId);
  });

export const abandonWritingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(writingSessionInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return abandonWritingSession(userId, data.sessionId);
  });

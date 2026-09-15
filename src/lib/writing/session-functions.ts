import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  abandonWritingSession,
  completeWritingSession,
  getWritingSession,
  startWritingSession,
} from "@/server/writing/sessions";

const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const startWritingSessionInputSchema = z
  .object({
    userId: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    title: z.string().trim().max(160).optional(),
    writingType: z.string().trim().min(1).max(80).optional(),
    targetCefrLevel: cefrLevelSchema.optional(),
    prompt: z.string().trim().max(4000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.taskId) {
      return;
    }

    if (!value.writingType) {
      ctx.addIssue({
        code: "custom",
        path: ["writingType"],
        message: "Writing type is required for custom writing.",
      });
    }

    if (!value.targetCefrLevel) {
      ctx.addIssue({
        code: "custom",
        path: ["targetCefrLevel"],
        message: "Target CEFR level is required for custom writing.",
      });
    }
  });

const writingSessionInputSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export const startWritingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(startWritingSessionInputSchema)
  .handler(async ({ data }) => {
    return startWritingSession(data.userId, {
      taskId: data.taskId,
      title: data.title,
      writingType: data.writingType,
      targetCefrLevel: data.targetCefrLevel,
      prompt: data.prompt,
    });
  });

export const getWritingSessionServerFn = createServerFn({
  method: "GET",
})
  .validator(writingSessionInputSchema)
  .handler(async ({ data }) => {
    return getWritingSession(data.userId, data.sessionId);
  });

export const completeWritingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(writingSessionInputSchema)
  .handler(async ({ data }) => {
    return completeWritingSession(data.userId, data.sessionId);
  });

export const abandonWritingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(writingSessionInputSchema)
  .handler(async ({ data }) => {
    return abandonWritingSession(data.userId, data.sessionId);
  });

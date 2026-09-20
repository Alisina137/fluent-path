import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const levelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const getListeningDashboardServerFn = createServerFn({ method: "GET" })
  .validator(z.object({
    level: levelSchema.optional(),
    topic: z.string().trim().min(1).max(80).optional(),
    query: z.string().trim().max(100).optional(),
    page: z.number().int().min(1).max(10000).optional(),
    pageSize: z.number().int().min(6).max(30).optional(),
  }))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");
    const { getListeningDashboard } = await import("@/server/listening/service");
    return getListeningDashboard(await requireAuthenticatedUserId(), data);
  });

export const getListeningLessonServerFn = createServerFn({ method: "GET" })
  .validator(z.object({ lessonId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");
    const { getListeningLesson } = await import("@/server/listening/service");
    return getListeningLesson(await requireAuthenticatedUserId(), data.lessonId);
  });

export const submitListeningComprehensionServerFn = createServerFn({ method: "POST" })
  .validator(z.object({ lessonId: z.string().uuid(), answers: z.array(z.number().int().min(0).max(20)).min(1).max(20) }))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");
    const { submitListeningComprehension } = await import("@/server/listening/service");
    return submitListeningComprehension(await requireAuthenticatedUserId(), data.lessonId, data.answers);
  });

export const submitListeningDictationServerFn = createServerFn({ method: "POST" })
  .validator(z.object({ lessonId: z.string().uuid(), answer: z.string().trim().min(1).max(5000) }))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");
    const { submitListeningDictation } = await import("@/server/listening/service");
    return submitListeningDictation(await requireAuthenticatedUserId(), data.lessonId, data.answer);
  });

export const recordListeningShadowingServerFn = createServerFn({ method: "POST" })
  .validator(z.object({ lessonId: z.string().uuid(), durationSeconds: z.number().int().min(1).max(900) }))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");
    const { recordListeningShadowing } = await import("@/server/listening/service");
    return recordListeningShadowing(await requireAuthenticatedUserId(), data.lessonId, data.durationSeconds);
  });

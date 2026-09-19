import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getWritingHistory } from "@/server/writing/history";

const writingSessionStatusSchema = z.enum(["active", "completed", "abandoned"]);

const writingHistoryInputSchema = z.object({
  status: writingSessionStatusSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z
    .object({
      startedAt: z.coerce.date(),
      id: z.string().uuid(),
    })
    .optional(),
});

export const getWritingHistoryServerFn = createServerFn({
  method: "GET",
})
  .validator(writingHistoryInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return getWritingHistory(userId, {
      status: data.status,
      limit: data.limit,
      cursor: data.cursor,
    });
  });

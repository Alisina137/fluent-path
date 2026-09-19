import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getWritingDraft, saveWritingDraft } from "@/server/writing/drafts";

const writingDraftSessionInputSchema = z.object({
  sessionId: z.string().uuid(),
});

const saveWritingDraftInputSchema = writingDraftSessionInputSchema.extend({
  content: z.string().max(100_000),
});

export const getWritingDraftServerFn = createServerFn({
  method: "GET",
})
  .validator(writingDraftSessionInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return getWritingDraft(userId, data.sessionId);
  });

export const saveWritingDraftServerFn = createServerFn({
  method: "POST",
})
  .validator(saveWritingDraftInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return saveWritingDraft(userId, data.sessionId, data.content);
  });

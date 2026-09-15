import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getWritingDraft, saveWritingDraft } from "@/server/writing/drafts";

const writingDraftSessionInputSchema = z.object({
  userId: z.string().uuid(),
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
    return getWritingDraft(data.userId, data.sessionId);
  });

export const saveWritingDraftServerFn = createServerFn({
  method: "POST",
})
  .validator(saveWritingDraftInputSchema)
  .handler(async ({ data }) => {
    return saveWritingDraft(data.userId, data.sessionId, data.content);
  });

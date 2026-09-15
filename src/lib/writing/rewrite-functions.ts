import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateWritingRewriteSuggestion } from "@/server/writing/rewrite/service";

const writingRewriteInputSchema = z.object({
  userId: z.string().min(1),
  revisionId: z.string().uuid(),
  feedbackId: z.string().min(1).max(500),
});

export const requestWritingRewriteServerFn = createServerFn({
  method: "POST",
})
  .validator(writingRewriteInputSchema)
  .handler(async ({ data }) => {
    return generateWritingRewriteSuggestion(data.userId, {
      revisionId: data.revisionId,
      feedbackId: data.feedbackId,
    });
  });

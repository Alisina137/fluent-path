import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateWritingRewriteSuggestion } from "@/server/writing/rewrite/service";

const writingRewriteInputSchema = z.object({
  revisionId: z.string().uuid(),
  feedbackId: z.string().min(1).max(500),
});

export const requestWritingRewriteServerFn = createServerFn({
  method: "POST",
})
  .validator(writingRewriteInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return generateWritingRewriteSuggestion(userId, {
      revisionId: data.revisionId,
      feedbackId: data.feedbackId,
    });
  });

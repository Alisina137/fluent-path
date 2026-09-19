import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { compareOwnedWritingRevisions } from "@/server/writing/revisions";

const compareWritingRevisionsInputSchema = z.object({
  sessionId: z.string().uuid(),
  beforeRevisionId: z.string().uuid(),
  afterRevisionId: z.string().uuid(),
});

export const compareWritingRevisionsServerFn = createServerFn({
  method: "POST",
})
  .validator(compareWritingRevisionsInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return compareOwnedWritingRevisions(
      userId,
      data.sessionId,
      data.beforeRevisionId,
      data.afterRevisionId,
    );
  });

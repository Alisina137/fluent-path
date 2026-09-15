import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { compareOwnedWritingRevisions } from "@/server/writing/revisions";

const compareWritingRevisionsInputSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().uuid(),
  beforeRevisionId: z.string().uuid(),
  afterRevisionId: z.string().uuid(),
});

export const compareWritingRevisionsServerFn = createServerFn({
  method: "POST",
})
  .validator(compareWritingRevisionsInputSchema)
  .handler(async ({ data }) => {
    return compareOwnedWritingRevisions(
      data.userId,
      data.sessionId,
      data.beforeRevisionId,
      data.afterRevisionId,
    );
  });

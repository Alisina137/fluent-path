import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requestParaphrases } from "@/server/writing/assistance/paraphrase-service";

const paraphraseRequestSchema = z
  .object({
    selectedText: z.string().trim().min(1).max(5_000),

    targetCefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),

    goal: z.enum(["natural", "simpler", "concise", "clearer"]),
  })
  .strict();

export const requestParaphrasesServerFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => paraphraseRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return requestParaphrases(userId, {
      selectedText: data.selectedText,
      targetCefrLevel: data.targetCefrLevel,
      goal: data.goal,
    });
  });

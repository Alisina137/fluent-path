import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requestToneGuidance } from "@/server/writing/assistance/tone-service";

const toneGuidanceRequestSchema = z
  .object({
    selectedText: z.string().trim().min(1).max(5_000),

    targetCefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),

    targetTone: z.enum(["neutral", "formal", "informal", "professional", "friendly", "academic"]),
  })
  .strict();

export const requestToneGuidanceServerFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => toneGuidanceRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return requestToneGuidance(userId, {
      selectedText: data.selectedText,
      targetCefrLevel: data.targetCefrLevel,
      targetTone: data.targetTone,
    });
  });

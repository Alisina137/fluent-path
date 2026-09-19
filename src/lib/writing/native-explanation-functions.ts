import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requestNativeExplanation } from "@/server/writing/assistance/native-explanation-service";

const nativeExplanationRequestSchema = z
  .object({
    englishExplanation: z.string().trim().min(1).max(5_000),

    targetLanguage: z.enum([
      "English",
      "Spanish",
      "Persian",
      "Arabic",
      "Chinese",
      "French",
      "German",
      "Portuguese",
      "Hindi",
      "Japanese",
      "Korean",
    ]),

    targetCefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),

    context: z.enum(["grammar", "vocabulary", "tone", "paraphrasing", "general"]),
  })
  .strict();

export const requestNativeExplanationServerFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => nativeExplanationRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return requestNativeExplanation(userId, {
      englishExplanation: data.englishExplanation,
      targetLanguage: data.targetLanguage,
      targetCefrLevel: data.targetCefrLevel,
      context: data.context,
    });
  });

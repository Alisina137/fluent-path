import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requestVocabularySuggestions } from "@/server/writing/assistance/vocabulary-service";

const vocabularySuggestionRequestSchema = z
  .object({
    selectedText: z.string().trim().min(1).max(5_000),

    targetCefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  })
  .strict();

export const requestVocabularySuggestionsServerFn = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => vocabularySuggestionRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return requestVocabularySuggestions(userId, {
      selectedText: data.selectedText,
      targetCefrLevel: data.targetCefrLevel,
    });
  });

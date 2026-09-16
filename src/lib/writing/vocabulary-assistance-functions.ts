import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requestVocabularySuggestions } from "@/server/writing/assistance/vocabulary-service";

const vocabularySuggestionRequestSchema = z
  .object({
    userId: z.string().uuid(),

    selectedText: z.string().trim().min(1).max(5_000),

    targetCefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  })
  .strict();

export const requestVocabularySuggestionsServerFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) => vocabularySuggestionRequestSchema.parse(data))
  .handler(async ({ data }) => {
    return requestVocabularySuggestions(data.userId, {
      selectedText: data.selectedText,
      targetCefrLevel: data.targetCefrLevel,
    });
  });

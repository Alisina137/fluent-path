import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requestGrammarHelp } from "@/server/writing/assistance/grammar-service";
import { writingAssistanceCefrLevels } from "@/server/writing/assistance/types";

const grammarHelpInputSchema = z
  .object({
    userId: z.string().uuid(),

    selectedText: z.string().trim().min(1).max(5_000),

    targetCefrLevel: z.enum(writingAssistanceCefrLevels),
  })
  .strict();

export const requestGrammarHelpServerFn = createServerFn({
  method: "POST",
})
  .validator(grammarHelpInputSchema)
  .handler(async ({ data }) => {
    return requestGrammarHelp(data.userId, {
      selectedText: data.selectedText,
      targetCefrLevel: data.targetCefrLevel,
    });
  });

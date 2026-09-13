import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { addUserSpeakingMessage, getSpeakingConversation } from "@/server/speaking/messages";

const conversationInputSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

const userMessageInputSchema = conversationInputSchema.extend({
  content: z.string().trim().min(1).max(10_000),
});

export const getSpeakingConversationServerFn = createServerFn({
  method: "GET",
})
  .validator(conversationInputSchema)
  .handler(async ({ data }) => {
    return getSpeakingConversation(data.userId, data.sessionId);
  });

export const addUserSpeakingMessageServerFn = createServerFn({
  method: "POST",
})
  .validator(userMessageInputSchema)
  .handler(async ({ data }) => {
    return addUserSpeakingMessage(data.userId, data.sessionId, data.content);
  });

import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { logServerError } from "@/lib/observability/server-logger";

type ConversationReplyFailureCode =
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "invalid_response"
  | "generation_failed"
  | "session_unavailable"
  | "no_learner_message"
  | "conversation_changed"
  | "unexpected_error";

type ConversationReplyFailure = {
  code: ConversationReplyFailureCode;
  message: string;
  retryable: boolean;
};

const generateConversationReplyInputSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

type GenerateConversationReplyInput = z.infer<typeof generateConversationReplyInputSchema>;

function validateInput(data: unknown): GenerateConversationReplyInput {
  return generateConversationReplyInputSchema.parse(data);
}

function getSafeFailureMessage(code: ConversationReplyFailureCode): string {
  switch (code) {
    case "authentication_failed":
    case "configuration_error":
      return "The AI Coach is not available because the AI service is not configured correctly.";

    case "rate_limited":
      return "The AI Coach is receiving too many requests right now. Please try again shortly.";

    case "provider_unavailable":
      return "The AI Coach is temporarily unavailable. Please try again.";

    case "invalid_response":
      return "The AI Coach returned an invalid response. Please try again.";

    case "generation_failed":
      return "The AI Coach could not generate a response to this message.";

    case "session_unavailable":
      return "This speaking session is no longer active.";

    case "no_learner_message":
      return "There is no learner message waiting for an AI response.";

    case "conversation_changed":
      return "The conversation changed while the AI response was being generated. Please try again.";

    default:
      return "The AI Coach could not respond right now.";
  }
}

export const generateSpeakingCoachReplyServerFn = createServerFn({
  method: "POST",
})
  .validator(validateInput)
  .handler(async ({ data }) => {
    const { userId, sessionId } = data;

    const [
      { getSpeakingSession },
      { getSpeakingConversation, addAssistantSpeakingMessage },
      { generateSpeakingCoachResponse },
      { ConversationAiError },
    ] = await Promise.all([
      import("@/server/speaking/sessions"),
      import("@/server/speaking/messages"),
      import("@/server/speaking/conversation-ai/service"),
      import("@/server/speaking/conversation-ai/types"),
    ]);

    try {
      const session = await getSpeakingSession(userId, sessionId);

      if (session.status !== "active") {
        return {
          ok: false as const,
          error: {
            code: "session_unavailable",
            message: getSafeFailureMessage("session_unavailable"),
            retryable: false,
          } satisfies ConversationReplyFailure,
        };
      }

      const conversation = await getSpeakingConversation(userId, sessionId);

      const latestMessage = conversation[conversation.length - 1];

      if (!latestMessage) {
        return {
          ok: false as const,
          error: {
            code: "no_learner_message",
            message: getSafeFailureMessage("no_learner_message"),
            retryable: false,
          } satisfies ConversationReplyFailure,
        };
      }

      /*
       * Idempotent retry behavior.
       *
       * If an assistant reply already exists as
       * the latest message, do not generate another
       * one merely because the browser retried.
       */
      if (latestMessage.role === "assistant") {
        return {
          ok: true as const,
          generated: false,
          message: latestMessage,
        };
      }

      const sourceUserMessageId = latestMessage.id;

      const generated = await generateSpeakingCoachResponse(userId, conversation);

      /*
       * Re-read before persistence.
       *
       * The conversation may have changed while
       * the model request was running.
       */
      const latestConversation = await getSpeakingConversation(userId, sessionId);

      const latestAfterGeneration = latestConversation[latestConversation.length - 1];

      if (latestAfterGeneration?.role === "assistant") {
        return {
          ok: true as const,
          generated: false,
          message: latestAfterGeneration,
        };
      }

      if (
        !latestAfterGeneration ||
        latestAfterGeneration.role !== "user" ||
        latestAfterGeneration.id !== sourceUserMessageId
      ) {
        return {
          ok: false as const,
          error: {
            code: "conversation_changed",
            message: getSafeFailureMessage("conversation_changed"),
            retryable: true,
          } satisfies ConversationReplyFailure,
        };
      }

      const assistantMessage = await addAssistantSpeakingMessage(
        userId,
        sessionId,
        generated.content,
      );

      return {
        ok: true as const,
        generated: true,
        message: assistantMessage,
        provider: generated.provider,
        model: generated.model,
        providerRequestId: generated.providerRequestId,
      };
    } catch (error) {
      if (error instanceof ConversationAiError) {
        const code = error.code;

        logServerError({
          subsystem: "speaking_ai",
          operation: "generate_conversation_reply",
          error,
          code,
        });

        return {
          ok: false as const,
          error: {
            code,
            message: getSafeFailureMessage(code),
            retryable: error.retryable,
          } satisfies ConversationReplyFailure,
        };
      }

      logServerError({
        subsystem: "speaking_ai",
        operation: "generate_conversation_reply",
        error,
      });

      return {
        ok: false as const,
        error: {
          code: "unexpected_error",
          message: getSafeFailureMessage("unexpected_error"),
          retryable: true,
        } satisfies ConversationReplyFailure,
      };
    }
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const grammarEvaluationInputSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid(),
});

type GrammarFeedbackFailureCode =
  | "message_not_found"
  | "invalid_message_role"
  | "invalid_text"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "evaluation_failed"
  | "invalid_response"
  | "unexpected_error";

type GrammarFeedbackSuccess = {
  ok: true;
  feedback: {
    isCorrect: boolean;
    score: number;
    correctedText: string;
    summary: string;
    issues: Array<{
      category:
        | "verb_tense"
        | "subject_verb_agreement"
        | "articles"
        | "prepositions"
        | "pronouns"
        | "pluralization"
        | "word_order"
        | "sentence_structure"
        | "auxiliary_verbs"
        | "conditionals"
        | "comparatives"
        | "other";
      severity: "minor" | "medium" | "major";
      original: string;
      correction: string;
      explanation: string;
    }>;
  };
};

type GrammarFeedbackFailure = {
  ok: false;
  error: {
    code: GrammarFeedbackFailureCode;
    message: string;
    retryable: boolean;
  };
};

export type GrammarFeedbackServerResult = GrammarFeedbackSuccess | GrammarFeedbackFailure;

const grammarErrorCodes = new Set<GrammarFeedbackFailureCode>([
  "invalid_text",
  "configuration_error",
  "authentication_failed",
  "rate_limited",
  "provider_unavailable",
  "evaluation_failed",
  "invalid_response",
]);

function isGrammarEvaluationError(error: unknown): error is {
  code: GrammarFeedbackFailureCode;
  retryable: boolean;
} {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: unknown;
    code?: unknown;
    retryable?: unknown;
  };

  return (
    candidate.name === "GrammarEvaluationError" &&
    typeof candidate.code === "string" &&
    grammarErrorCodes.has(candidate.code as GrammarFeedbackFailureCode) &&
    typeof candidate.retryable === "boolean"
  );
}

function safeGrammarErrorMessage(code: GrammarFeedbackFailureCode): string {
  switch (code) {
    case "message_not_found":
      return "This learner message could not be found.";

    case "invalid_message_role":
      return "Grammar feedback can only evaluate learner messages.";

    case "invalid_text":
      return "This learner message cannot be evaluated.";

    case "rate_limited":
      return "Grammar evaluation is busy. Please try again shortly.";

    case "provider_unavailable":
      return "Grammar evaluation is temporarily unavailable. Please try again.";

    case "configuration_error":
    case "authentication_failed":
      return "Grammar evaluation is temporarily unavailable.";

    case "evaluation_failed":
    case "invalid_response":
      return "Grammar feedback could not be generated. Please try again.";

    default:
      return "Grammar feedback could not be generated. Please try again.";
  }
}

export const evaluateSpeakingGrammarServerFn = createServerFn({
  method: "POST",
})
  .inputValidator(grammarEvaluationInputSchema)
  .handler(async ({ data }): Promise<GrammarFeedbackServerResult> => {
    try {
      const [messagesModule, grammarModule] = await Promise.all([
        import("@/server/speaking/messages"),
        import("@/server/speaking/feedback/grammar/service"),
      ]);

      const conversation = await messagesModule.getSpeakingConversation(
        data.userId,
        data.sessionId,
      );

      const message = conversation.find((candidate) => candidate.id === data.messageId);

      if (!message) {
        return {
          ok: false,
          error: {
            code: "message_not_found",
            message: safeGrammarErrorMessage("message_not_found"),
            retryable: false,
          },
        };
      }

      if (message.role !== "user") {
        return {
          ok: false,
          error: {
            code: "invalid_message_role",
            message: safeGrammarErrorMessage("invalid_message_role"),
            retryable: false,
          },
        };
      }

      const result = await grammarModule.evaluateSpeakingGrammar(message.content);

      return {
        ok: true,
        feedback: result.evaluation,
      };
    } catch (error) {
      if (isGrammarEvaluationError(error)) {
        return {
          ok: false,
          error: {
            code: error.code,
            message: safeGrammarErrorMessage(error.code),
            retryable: error.retryable,
          },
        };
      }

      console.error("[Speaking Grammar Feedback] Evaluation failed", error);

      return {
        ok: false,
        error: {
          code: "unexpected_error",
          message: safeGrammarErrorMessage("unexpected_error"),
          retryable: true,
        },
      };
    }
  });

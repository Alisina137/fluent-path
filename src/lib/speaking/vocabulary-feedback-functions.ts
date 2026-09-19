import { createServerFn } from "@tanstack/react-start";
import { logServerError } from "@/lib/observability/server-logger";
import { z } from "zod";

const vocabularyEvaluationInputSchema = z.object({
  userId: z.string().uuid(),

  sessionId: z.string().uuid(),

  messageId: z.string().uuid(),
});

type VocabularyFeedbackFailureCode =
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

type VocabularyFeedbackSuccess = {
  ok: true;

  feedback: {
    score: number;

    range: "basic" | "developing" | "good" | "strong";

    isAppropriate: boolean;

    summary: string;

    suggestedText: string;

    strengths: Array<{
      expression: string;
      explanation: string;
    }>;

    issues: Array<{
      category:
        | "word_choice"
        | "repetition"
        | "collocation"
        | "precision"
        | "register"
        | "word_form"
        | "natural_expression"
        | "other";

      severity: "minor" | "medium" | "major";

      original: string;

      suggestion: string;

      explanation: string;
    }>;
  };
};

type VocabularyFeedbackFailure = {
  ok: false;

  error: {
    code: VocabularyFeedbackFailureCode;

    message: string;

    retryable: boolean;
  };
};

export type VocabularyFeedbackServerResult = VocabularyFeedbackSuccess | VocabularyFeedbackFailure;

const vocabularyErrorCodes = new Set<VocabularyFeedbackFailureCode>([
  "invalid_text",
  "configuration_error",
  "authentication_failed",
  "rate_limited",
  "provider_unavailable",
  "evaluation_failed",
  "invalid_response",
]);

function isVocabularyEvaluationError(error: unknown): error is {
  code: VocabularyFeedbackFailureCode;
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
    candidate.name === "VocabularyEvaluationError" &&
    typeof candidate.code === "string" &&
    vocabularyErrorCodes.has(candidate.code as VocabularyFeedbackFailureCode) &&
    typeof candidate.retryable === "boolean"
  );
}

function safeVocabularyErrorMessage(code: VocabularyFeedbackFailureCode): string {
  switch (code) {
    case "message_not_found":
      return "This learner message could not be found.";

    case "invalid_message_role":
      return "Vocabulary feedback can only evaluate learner messages.";

    case "invalid_text":
      return "This learner message cannot be evaluated.";

    case "rate_limited":
      return "Vocabulary evaluation is busy. Please try again shortly.";

    case "provider_unavailable":
      return "Vocabulary evaluation is temporarily unavailable. Please try again.";

    case "configuration_error":
    case "authentication_failed":
      return "Vocabulary evaluation is temporarily unavailable.";

    case "evaluation_failed":
    case "invalid_response":
      return "Vocabulary feedback could not be generated. Please try again.";

    default:
      return "Vocabulary feedback could not be generated. Please try again.";
  }
}

export const evaluateSpeakingVocabularyServerFn = createServerFn({
  method: "POST",
})
  .validator(vocabularyEvaluationInputSchema)
  .handler(async ({ data }): Promise<VocabularyFeedbackServerResult> => {
    try {
      const [messagesModule, vocabularyModule] = await Promise.all([
        import("@/server/speaking/messages"),

        import("@/server/speaking/feedback/vocabulary/service"),
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

            message: safeVocabularyErrorMessage("message_not_found"),

            retryable: false,
          },
        };
      }

      if (message.role !== "user") {
        return {
          ok: false,

          error: {
            code: "invalid_message_role",

            message: safeVocabularyErrorMessage("invalid_message_role"),

            retryable: false,
          },
        };
      }

      const persistenceModule = await import("@/server/speaking/feedback/persistence");

      const persisted = await persistenceModule.getPersistedSpeakingFeedback(
        data.userId,
        data.sessionId,
        data.messageId,
        "vocabulary",
      );

      if (persisted) {
        return {
          ok: true,

          feedback: persisted.evaluation as VocabularyFeedbackSuccess["feedback"],
        };
      }

      const { evaluateSpeakingFeedbackOnce } =
        await import("@/server/speaking/feedback/evaluate-once");

      const result = await evaluateSpeakingFeedbackOnce({
        userId: data.userId,
        sessionId: data.sessionId,
        messageId: data.messageId,
        skill: "vocabulary",
        evaluate: () => vocabularyModule.evaluateSpeakingVocabulary(message.content),
      });

      const stored = await persistenceModule.persistSpeakingFeedback({
        userId: data.userId,
        sessionId: data.sessionId,
        messageId: data.messageId,
        skill: "vocabulary",
        score: result.evaluation.score,
        evaluation: result.evaluation,
        provider: result.provider,
        model: result.model,
        providerRequestId: result.providerRequestId,
      });

      return {
        ok: true,

        feedback: stored.evaluation as VocabularyFeedbackSuccess["feedback"],
      };
    } catch (error) {
      if (isVocabularyEvaluationError(error)) {
        return {
          ok: false,

          error: {
            code: error.code,

            message: safeVocabularyErrorMessage(error.code),

            retryable: error.retryable,
          },
        };
      }

      logServerError({
        subsystem: "speaking_vocabulary_feedback",
        operation: "evaluate_vocabulary",
        error,
      });
      return {
        ok: false,

        error: {
          code: "unexpected_error",

          message: safeVocabularyErrorMessage("unexpected_error"),

          retryable: true,
        },
      };
    }
  });

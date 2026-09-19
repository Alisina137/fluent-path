import { createServerFn } from "@tanstack/react-start";
import { logServerError } from "@/lib/observability/server-logger";
import { z } from "zod";

const fluencyEvaluationInputSchema = z.object({
  userId: z.string().uuid(),

  sessionId: z.string().uuid(),

  messageId: z.string().uuid(),
});

type FluencyFeedbackFailureCode =
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

type FluencyFeedbackSuccess = {
  ok: true;

  feedback: {
    measurementBasis: "transcript_only";

    score: number;

    level: "limited" | "developing" | "functional" | "smooth";

    summary: string;

    improvementTip: string;

    strengths: Array<{
      evidence: string;
      explanation: string;
    }>;

    issues: Array<{
      category:
        | "fragmentation"
        | "repetition"
        | "filler_usage"
        | "discourse_flow"
        | "idea_development"
        | "other";

      severity: "minor" | "medium" | "major";

      evidence: string;
      suggestion: string;
      explanation: string;
    }>;

    metrics: {
      wordCount: number;
      uniqueWordCount: number;
      lexicalRepetitionRatio: number;
      visibleFillerCount: number;
    };
  };
};

type FluencyFeedbackFailure = {
  ok: false;

  error: {
    code: FluencyFeedbackFailureCode;

    message: string;

    retryable: boolean;
  };
};

export type FluencyFeedbackServerResult = FluencyFeedbackSuccess | FluencyFeedbackFailure;

const fluencyErrorCodes = new Set<FluencyFeedbackFailureCode>([
  "invalid_text",
  "configuration_error",
  "authentication_failed",
  "rate_limited",
  "provider_unavailable",
  "evaluation_failed",
  "invalid_response",
]);

function isFluencyEvaluationError(error: unknown): error is {
  code: FluencyFeedbackFailureCode;
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
    candidate.name === "FluencyEvaluationError" &&
    typeof candidate.code === "string" &&
    fluencyErrorCodes.has(candidate.code as FluencyFeedbackFailureCode) &&
    typeof candidate.retryable === "boolean"
  );
}

function safeFluencyErrorMessage(code: FluencyFeedbackFailureCode): string {
  switch (code) {
    case "message_not_found":
      return "This learner message could not be found.";

    case "invalid_message_role":
      return "Fluency feedback can only evaluate learner messages.";

    case "invalid_text":
      return "This learner message cannot be evaluated.";

    case "rate_limited":
      return "Fluency evaluation is busy. Please try again shortly.";

    case "provider_unavailable":
      return "Fluency evaluation is temporarily unavailable. Please try again.";

    case "configuration_error":
    case "authentication_failed":
      return "Fluency evaluation is temporarily unavailable.";

    case "evaluation_failed":
    case "invalid_response":
      return "Fluency feedback could not be generated. Please try again.";

    default:
      return "Fluency feedback could not be generated. Please try again.";
  }
}

export const evaluateSpeakingFluencyServerFn = createServerFn({
  method: "POST",
})
  .validator(fluencyEvaluationInputSchema)
  .handler(async ({ data }): Promise<FluencyFeedbackServerResult> => {
    try {
      const [messagesModule, fluencyModule] = await Promise.all([
        import("@/server/speaking/messages"),

        import("@/server/speaking/feedback/fluency/service"),
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

            message: safeFluencyErrorMessage("message_not_found"),

            retryable: false,
          },
        };
      }

      if (message.role !== "user") {
        return {
          ok: false,

          error: {
            code: "invalid_message_role",

            message: safeFluencyErrorMessage("invalid_message_role"),

            retryable: false,
          },
        };
      }

      const persistenceModule = await import("@/server/speaking/feedback/persistence");

      const persisted = await persistenceModule.getPersistedSpeakingFeedback(
        data.userId,
        data.sessionId,
        data.messageId,
        "fluency",
      );

      if (persisted) {
        return {
          ok: true,

          feedback: persisted.evaluation as FluencyFeedbackSuccess["feedback"],
        };
      }

      const { evaluateSpeakingFeedbackOnce } =
        await import("@/server/speaking/feedback/evaluate-once");

      const result = await evaluateSpeakingFeedbackOnce({
        userId: data.userId,
        sessionId: data.sessionId,
        messageId: data.messageId,
        skill: "fluency",
        evaluate: () => fluencyModule.evaluateSpeakingFluency(message.content),
      });

      const stored = await persistenceModule.persistSpeakingFeedback({
        userId: data.userId,
        sessionId: data.sessionId,
        messageId: data.messageId,
        skill: "fluency",
        score: result.evaluation.score,
        evaluation: result.evaluation,
        provider: result.provider,
        model: result.model,
        providerRequestId: result.providerRequestId,
      });

      return {
        ok: true,

        feedback: stored.evaluation as FluencyFeedbackSuccess["feedback"],
      };
    } catch (error) {
      if (isFluencyEvaluationError(error)) {
        return {
          ok: false,

          error: {
            code: error.code,

            message: safeFluencyErrorMessage(error.code),

            retryable: error.retryable,
          },
        };
      }

      logServerError({
        subsystem: "speaking_fluency_feedback",
        operation: "evaluate_fluency",
        error,
      });

      return {
        ok: false,

        error: {
          code: "unexpected_error",

          message: safeFluencyErrorMessage("unexpected_error"),

          retryable: true,
        },
      };
    }
  });

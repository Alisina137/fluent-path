import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { logServerError } from "@/lib/observability/server-logger";

const speakingSpeechInputSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid(),
});

type ProviderSpeechFailureCode =
  | "invalid_text"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "generation_failed"
  | "invalid_response";

type SpeakingSpeechFailureCode =
  "message_not_found" | "invalid_message_role" | ProviderSpeechFailureCode | "unexpected_error";

type SpeakingSpeechFailure = {
  ok: false;
  error: {
    code: SpeakingSpeechFailureCode;
    message: string;
    retryable: boolean;
  };
};

type SpeakingSpeechSuccess = {
  ok: true;
  audioBase64: string;
  contentType: string;
  format: "mp3";
  voice: string;
};

export type SpeakingSpeechResult = SpeakingSpeechSuccess | SpeakingSpeechFailure;

const providerSpeechFailureCodes = new Set<ProviderSpeechFailureCode>([
  "invalid_text",
  "configuration_error",
  "authentication_failed",
  "rate_limited",
  "provider_unavailable",
  "generation_failed",
  "invalid_response",
]);

function isProviderSpeechError(error: unknown): error is {
  code: ProviderSpeechFailureCode;
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
    candidate.name === "TextToSpeechError" &&
    typeof candidate.code === "string" &&
    providerSpeechFailureCodes.has(candidate.code as ProviderSpeechFailureCode) &&
    typeof candidate.retryable === "boolean"
  );
}

function getSafeSpeechErrorMessage(code: SpeakingSpeechFailureCode): string {
  switch (code) {
    case "message_not_found":
      return "This AI Coach message could not be found.";

    case "invalid_message_role":
      return "Only AI Coach messages can be played.";

    case "invalid_text":
      return "This AI Coach response cannot be converted to speech.";

    case "authentication_failed":
    case "configuration_error":
      return "Voice playback is temporarily unavailable.";

    case "rate_limited":
      return "Voice generation is busy. Please try again shortly.";

    case "provider_unavailable":
      return "Voice generation is temporarily unavailable. Please try again.";

    case "generation_failed":
    case "invalid_response":
      return "The AI Coach voice could not be generated. Please try again.";

    default:
      return "Voice playback could not be prepared. Please try again.";
  }
}

/*
 * Lightweight server-instance request protection.
 *
 * This is intentionally a guard rather than the final
 * production distributed rate limiter. Task 6.10 will
 * harden this once server-authenticated identity exists.
 */
const TTS_RATE_WINDOW_MS = 60_000;

const MAX_TTS_REQUESTS_PER_WINDOW = 20;

const ttsRequestHistory = new Map<string, number[]>();

function consumeTtsRequestBudget(userId: string): boolean {
  const now = Date.now();

  const cutoff = now - TTS_RATE_WINDOW_MS;

  const previous = ttsRequestHistory.get(userId) ?? [];

  const recent = previous.filter((timestamp) => timestamp > cutoff);

  if (recent.length >= MAX_TTS_REQUESTS_PER_WINDOW) {
    ttsRequestHistory.set(userId, recent);

    return false;
  }

  recent.push(now);

  ttsRequestHistory.set(userId, recent);

  return true;
}

export const generateSpeakingMessageSpeechServerFn = createServerFn({
  method: "POST",
})
  .validator(speakingSpeechInputSchema)
  .handler(async ({ data }): Promise<SpeakingSpeechResult> => {
    try {
      const [messagesModule, ttsServiceModule] = await Promise.all([
        import("@/server/speaking/messages"),
        import("@/server/speaking/tts/service"),
      ]);

      const conversation = await messagesModule.getSpeakingConversation(
        data.userId,
        data.sessionId,
      );

      const message = conversation.find((item) => item.id === data.messageId);

      if (!message) {
        return {
          ok: false,
          error: {
            code: "message_not_found",
            message: getSafeSpeechErrorMessage("message_not_found"),
            retryable: false,
          },
        };
      }

      if (message.role !== "assistant") {
        return {
          ok: false,
          error: {
            code: "invalid_message_role",
            message: getSafeSpeechErrorMessage("invalid_message_role"),
            retryable: false,
          },
        };
      }

      if (!consumeTtsRequestBudget(data.userId)) {
        return {
          ok: false,
          error: {
            code: "rate_limited",
            message:
              "You have requested several voices very quickly. Please wait a moment and try again.",
            retryable: true,
          },
        };
      }

      const speech = await ttsServiceModule.generateSpeech({
        text: message.content,
      });

      return {
        ok: true,
        audioBase64: Buffer.from(speech.audio).toString("base64"),
        contentType: speech.contentType,
        format: speech.format,
        voice: speech.voice,
      };
    } catch (error) {
      if (isProviderSpeechError(error)) {
        return {
          ok: false,
          error: {
            code: error.code,
            message: getSafeSpeechErrorMessage(error.code),
            retryable: error.retryable,
          },
        };
      }

      logServerError({
        subsystem: "speaking_tts",
        operation: "generate_speech",
        error,
      });

      return {
        ok: false,
        error: {
          code: "unexpected_error",
          message: getSafeSpeechErrorMessage("unexpected_error"),
          retryable: true,
        },
      };
    }
  });

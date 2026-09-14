import { createServerFn } from "@tanstack/react-start";

type TranscriptionFailureCode =
  | "invalid_audio"
  | "unsupported_audio"
  | "provider_unavailable"
  | "rate_limited"
  | "authentication_failed"
  | "transcription_failed"
  | "configuration_error"
  | "session_unavailable"
  | "unexpected_error";

type TranscriptionFailure = {
  code: TranscriptionFailureCode;
  message: string;
  retryable: boolean;
};

function validateTranscriptionFormData(data: unknown): FormData {
  if (!(data instanceof FormData)) {
    throw new Error("Invalid transcription request.");
  }

  return data;
}

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required transcription field: ${key}`);
  }

  return value.trim();
}

export const transcribeSpeakingAudioServerFn = createServerFn({
  method: "POST",
})
  .validator(validateTranscriptionFormData)
  .handler(async ({ data }) => {
    const userId = readRequiredString(data, "userId");

    const sessionId = readRequiredString(data, "sessionId");

    const durationValue = readRequiredString(data, "durationMs");

    const durationMs = Number(durationValue);

    if (!Number.isFinite(durationMs)) {
      return {
        ok: false as const,
        error: {
          code: "invalid_audio",
          message: "The recording duration is invalid.",
          retryable: false,
        } satisfies TranscriptionFailure,
      };
    }

    const languageValue = data.get("language");

    const language =
      typeof languageValue === "string" && languageValue.trim() ? languageValue.trim() : undefined;

    const audio = data.get("audio");

    if (!(audio instanceof File)) {
      return {
        ok: false as const,
        error: {
          code: "invalid_audio",
          message: "A valid audio recording is required.",
          retryable: false,
        } satisfies TranscriptionFailure,
      };
    }

    const [
      { getSpeakingSession },
      { addUserSpeakingMessage },
      { createSpeechToTextAudioInput },
      { transcribeSpeech },
      { normalizeSpeechTranscript },
      { SpeechToTextError },
    ] = await Promise.all([
      import("@/server/speaking/sessions"),
      import("@/server/speaking/messages"),
      import("@/server/speaking/stt/audio-input"),
      import("@/server/speaking/stt/service"),
      import("@/server/speaking/stt/transcript"),
      import("@/server/speaking/stt/types"),
    ]);

    try {
      const session = await getSpeakingSession(userId, sessionId);

      if (session.status !== "active") {
        return {
          ok: false as const,
          error: {
            code: "session_unavailable",
            message: "This speaking session is no longer active.",
            retryable: false,
          } satisfies TranscriptionFailure,
        };
      }

      const audioInput = await createSpeechToTextAudioInput(audio, durationMs);

      const transcription = await transcribeSpeech({
        audio: audioInput,
        language,
      });

      const transcript = normalizeSpeechTranscript(transcription.transcript);

      const message = await addUserSpeakingMessage(userId, sessionId, transcript);

      return {
        ok: true as const,
        transcript,
        message,
        language: transcription.language,
        durationMs: transcription.durationMs,
        provider: transcription.provider,
        providerRequestId: transcription.providerRequestId,
      };
    } catch (error) {
      if (error instanceof SpeechToTextError) {
        return {
          ok: false as const,
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          } satisfies TranscriptionFailure,
        };
      }

      console.error("[Speaking STT] Unexpected transcription failure", {
        sessionId,
        error,
      });

      return {
        ok: false as const,
        error: {
          code: "unexpected_error",
          message: "Your recording could not be processed right now.",
          retryable: true,
        } satisfies TranscriptionFailure,
      };
    }
  });

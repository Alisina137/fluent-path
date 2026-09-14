import type { SpeechToTextProvider } from "./provider";
import { getOpenAiApiKey, getOpenAiTranscriptionModel } from "./openai-config";
import { SpeechToTextError, type SpeechToTextRequest, type SpeechToTextResult } from "./types";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

const TRANSCRIPTION_TIMEOUT_MS = 45_000;

type OpenAiTranscriptionResponse = {
  text?: unknown;
};

type OpenAiErrorResponse = {
  error?: {
    message?: unknown;
    type?: unknown;
    code?: unknown;
  };
};

function getErrorIdentifier(payload: OpenAiErrorResponse | null): string | null {
  const code = payload?.error?.code;

  if (typeof code === "string") {
    return code.toLowerCase();
  }

  const type = payload?.error?.type;

  if (typeof type === "string") {
    return type.toLowerCase();
  }

  return null;
}

async function readOpenAiError(response: Response): Promise<OpenAiErrorResponse | null> {
  try {
    return (await response.json()) as OpenAiErrorResponse;
  } catch {
    return null;
  }
}

function mapOpenAiError(status: number, payload: OpenAiErrorResponse | null): SpeechToTextError {
  const identifier = getErrorIdentifier(payload);

  if (status === 401 || status === 403) {
    return new SpeechToTextError({
      code: "authentication_failed",
      provider: "openai",
      retryable: false,
      message: "Speech transcription is not configured correctly. Please contact support.",
    });
  }

  if (status === 429) {
    const quotaFailure =
      identifier === "insufficient_quota" ||
      identifier === "credit_balance_exhausted" ||
      identifier === "organization_usage_limit_exceeded";

    if (quotaFailure) {
      return new SpeechToTextError({
        code: "provider_unavailable",
        provider: "openai",
        retryable: false,
        message:
          "Speech transcription is temporarily unavailable because the service account has reached its usage limit.",
      });
    }

    return new SpeechToTextError({
      code: "rate_limited",
      provider: "openai",
      retryable: true,
      message: "Speech transcription is busy right now. Please wait a moment and try again.",
    });
  }

  if (status === 408 || status === 409) {
    return new SpeechToTextError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message: "Speech transcription could not complete. Please try again.",
    });
  }

  if (status >= 500) {
    return new SpeechToTextError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message: "Speech transcription is temporarily unavailable. Please try again.",
    });
  }

  if (status >= 400 && status < 500) {
    return new SpeechToTextError({
      code: "transcription_failed",
      provider: "openai",
      retryable: false,
      message: "The recording could not be transcribed. Try making a new recording.",
    });
  }

  return new SpeechToTextError({
    code: "transcription_failed",
    provider: "openai",
    retryable: true,
    message: "Speech transcription failed unexpectedly. Please try again.",
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

async function transcribeWithOpenAi(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
  const apiKey = getOpenAiApiKey();
  const model = getOpenAiTranscriptionModel();

  const audioBytes = new Uint8Array(request.audio.data);

  const audioBlob = new Blob([audioBytes], {
    type: request.audio.mimeType,
  });

  const formData = new FormData();

  formData.append("file", audioBlob, request.audio.fileName);

  formData.append("model", model);
  formData.append("response_format", "json");

  if (request.language?.trim()) {
    formData.append("language", request.language.trim());
  }

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, TRANSCRIPTION_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new SpeechToTextError({
        code: "provider_unavailable",
        provider: "openai",
        retryable: true,
        message: "Speech transcription took too long. Please try again.",
        cause: error,
      });
    }

    throw new SpeechToTextError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message:
        "The speech transcription service could not be reached. Check your connection and try again.",
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorPayload = await readOpenAiError(response);

    throw mapOpenAiError(response.status, errorPayload);
  }

  let payload: OpenAiTranscriptionResponse;

  try {
    payload = (await response.json()) as OpenAiTranscriptionResponse;
  } catch (error) {
    throw new SpeechToTextError({
      code: "transcription_failed",
      provider: "openai",
      retryable: true,
      message: "The transcription service returned an invalid response. Please try again.",
      cause: error,
    });
  }

  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new SpeechToTextError({
      code: "transcription_failed",
      provider: "openai",
      retryable: false,
      message: "No recognizable speech was found. Try making a clearer recording.",
    });
  }

  return {
    transcript: payload.text.trim(),
    language: request.language?.trim() || null,
    durationMs: request.audio.durationMs ?? null,
    provider: "openai",
    providerRequestId: response.headers.get("x-request-id"),
  };
}

export const openAiSpeechToTextProvider: SpeechToTextProvider = {
  id: "openai",
  transcribe: transcribeWithOpenAi,
};

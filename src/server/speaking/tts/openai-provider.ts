import { getTextToSpeechApiKey, getTextToSpeechModel, getTextToSpeechVoice } from "./config";
import type { TextToSpeechProvider } from "./provider";
import { TextToSpeechError, type TextToSpeechRequest, type TextToSpeechResult } from "./types";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";

const REQUEST_TIMEOUT_MS = 45_000;

const MAX_TTS_TEXT_LENGTH = 4_000;

function normalizeText(text: string): string {
  const normalized = text.trim();

  if (!normalized) {
    throw new TextToSpeechError({
      code: "invalid_text",
      provider: "openai",
      retryable: false,
      message: "Text is required for speech generation.",
    });
  }

  if (normalized.length > MAX_TTS_TEXT_LENGTH) {
    throw new TextToSpeechError({
      code: "invalid_text",
      provider: "openai",
      retryable: false,
      message: "The text is too long for speech generation.",
    });
  }

  return normalized;
}

function mapOpenAiStatus(status: number): TextToSpeechError {
  if (status === 401 || status === 403) {
    return new TextToSpeechError({
      code: "authentication_failed",
      provider: "openai",
      retryable: false,
      message: "The text-to-speech service is not authorized.",
    });
  }

  if (status === 429) {
    return new TextToSpeechError({
      code: "rate_limited",
      provider: "openai",
      retryable: true,
      message: "The text-to-speech service is busy. Please try again shortly.",
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new TextToSpeechError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message: "The text-to-speech service is temporarily unavailable.",
    });
  }

  return new TextToSpeechError({
    code: "generation_failed",
    provider: "openai",
    retryable: false,
    message: "Speech could not be generated.",
  });
}

async function generateWithOpenAi(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
  const text = normalizeText(request.text);

  const apiKey = getTextToSpeechApiKey();

  const model = getTextToSpeechModel();

  const voice = request.voice?.trim() || getTextToSpeechVoice();

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(OPENAI_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        voice,
        input: text,
        response_format: "mp3",
      }),
    });
  } catch (error) {
    throw new TextToSpeechError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message: "The text-to-speech service could not be reached.",
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw mapOpenAiStatus(response.status);
  }

  let audioBuffer: ArrayBuffer;

  try {
    audioBuffer = await response.arrayBuffer();
  } catch (error) {
    throw new TextToSpeechError({
      code: "invalid_response",
      provider: "openai",
      retryable: true,
      message: "The text-to-speech service returned invalid audio.",
      cause: error,
    });
  }

  if (audioBuffer.byteLength === 0) {
    throw new TextToSpeechError({
      code: "invalid_response",
      provider: "openai",
      retryable: true,
      message: "The text-to-speech service returned empty audio.",
    });
  }

  return {
    audio: new Uint8Array(audioBuffer),
    contentType: response.headers.get("content-type") || "audio/mpeg",
    format: "mp3",
    provider: "openai",
    model,
    voice,
    providerRequestId: response.headers.get("x-request-id"),
  };
}

export const openAiTextToSpeechProvider: TextToSpeechProvider = {
  id: "openai",
  generate: generateWithOpenAi,
};

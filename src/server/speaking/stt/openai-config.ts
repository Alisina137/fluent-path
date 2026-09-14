import { SpeechToTextError } from "./types";

const DEFAULT_OPENAI_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

export function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new SpeechToTextError({
      code: "configuration_error",
      provider: "openai",
      message: "OpenAI speech-to-text is not configured.",
    });
  }

  return apiKey;
}

export function getOpenAiTranscriptionModel(): string {
  return process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || DEFAULT_OPENAI_TRANSCRIPTION_MODEL;
}

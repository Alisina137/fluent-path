import { TextToSpeechError, type TextToSpeechProviderId } from "./types";

const DEFAULT_PROVIDER: TextToSpeechProviderId = "openai";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini-tts";

const DEFAULT_OPENAI_VOICE = "alloy";

export function getTextToSpeechProviderId(): TextToSpeechProviderId {
  const configured = process.env.TEXT_TO_SPEECH_PROVIDER?.trim().toLowerCase();

  if (!configured) {
    return DEFAULT_PROVIDER;
  }

  if (configured !== "openai") {
    throw new TextToSpeechError({
      code: "configuration_error",
      message: `Unsupported text-to-speech provider: ${configured}`,
    });
  }

  return configured;
}

export function getTextToSpeechModel(): string {
  return process.env.OPENAI_TTS_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getTextToSpeechVoice(): string {
  return process.env.OPENAI_TTS_VOICE?.trim() || DEFAULT_OPENAI_VOICE;
}

export function getTextToSpeechApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new TextToSpeechError({
      code: "configuration_error",
      provider: "openai",
      message: "The text-to-speech service is not configured.",
    });
  }

  return apiKey;
}

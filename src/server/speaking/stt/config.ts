import { SpeechToTextError, type SpeechToTextProviderId } from "./types";

const DEFAULT_STT_PROVIDER: SpeechToTextProviderId = "openai";

function isSpeechToTextProviderId(value: string): value is SpeechToTextProviderId {
  return value === "openai";
}

export function getSpeechToTextProviderId(): SpeechToTextProviderId {
  const configuredProvider = process.env.SPEECH_TO_TEXT_PROVIDER?.trim().toLowerCase();

  if (!configuredProvider) {
    return DEFAULT_STT_PROVIDER;
  }

  if (!isSpeechToTextProviderId(configuredProvider)) {
    throw new SpeechToTextError({
      code: "configuration_error",
      message: `Unsupported speech-to-text provider: ${configuredProvider}`,
    });
  }

  return configuredProvider;
}

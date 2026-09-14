import { getTextToSpeechProviderId } from "./config";
import type { TextToSpeechProvider } from "./provider";
import { TextToSpeechError, type TextToSpeechProviderId } from "./types";

const providers = new Map<TextToSpeechProviderId, TextToSpeechProvider>();

export function registerTextToSpeechProvider(provider: TextToSpeechProvider): void {
  providers.set(provider.id, provider);
}

export function getTextToSpeechProvider(): TextToSpeechProvider {
  const providerId = getTextToSpeechProviderId();

  const provider = providers.get(providerId);

  if (!provider) {
    throw new TextToSpeechError({
      code: "configuration_error",
      message: `Text-to-speech provider "${providerId}" is not registered.`,
    });
  }

  return provider;
}

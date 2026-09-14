import { getSpeechToTextProviderId } from "./config";
import type { SpeechToTextProvider } from "./provider";
import { SpeechToTextError, type SpeechToTextProviderId } from "./types";

const providers = new Map<SpeechToTextProviderId, SpeechToTextProvider>();

export function registerSpeechToTextProvider(provider: SpeechToTextProvider): void {
  providers.set(provider.id, provider);
}

export function getSpeechToTextProvider(): SpeechToTextProvider {
  const providerId = getSpeechToTextProviderId();
  const provider = providers.get(providerId);

  if (!provider) {
    throw new SpeechToTextError({
      code: "configuration_error",
      provider: providerId,
      message: `Speech-to-text provider "${providerId}" has not been registered.`,
    });
  }

  return provider;
}

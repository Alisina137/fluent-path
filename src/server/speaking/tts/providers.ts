import { openAiTextToSpeechProvider } from "./openai-provider";
import { registerTextToSpeechProvider } from "./provider-registry";

let registered = false;

export function ensureTextToSpeechProvidersRegistered(): void {
  if (registered) {
    return;
  }

  registerTextToSpeechProvider(openAiTextToSpeechProvider);

  registered = true;
}

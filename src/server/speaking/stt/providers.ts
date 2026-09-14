import { openAiSpeechToTextProvider } from "./openai-provider";
import { registerSpeechToTextProvider } from "./provider-registry";

let registered = false;

export function ensureSpeechToTextProvidersRegistered(): void {
  if (registered) {
    return;
  }

  registerSpeechToTextProvider(openAiSpeechToTextProvider);

  registered = true;
}

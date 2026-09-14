import { openAiConversationProvider } from "./openai-provider";
import { registerConversationAiProvider } from "./provider-registry";

let registered = false;

export function ensureConversationAiProvidersRegistered(): void {
  if (registered) {
    return;
  }

  registerConversationAiProvider(openAiConversationProvider);

  registered = true;
}

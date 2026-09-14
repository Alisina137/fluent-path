import { getConversationAiProviderId } from "./config";
import type { ConversationAiProvider } from "./provider";
import { ConversationAiError, type ConversationAiProviderId } from "./types";

const providers = new Map<ConversationAiProviderId, ConversationAiProvider>();

export function registerConversationAiProvider(provider: ConversationAiProvider): void {
  providers.set(provider.id, provider);
}

export function getConversationAiProvider(): ConversationAiProvider {
  const providerId = getConversationAiProviderId();

  const provider = providers.get(providerId);

  if (!provider) {
    throw new ConversationAiError({
      code: "configuration_error",
      provider: providerId,
      message: `Conversation AI provider "${providerId}" has not been registered.`,
    });
  }

  return provider;
}

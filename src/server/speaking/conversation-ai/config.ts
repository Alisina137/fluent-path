import { ConversationAiError, type ConversationAiProviderId } from "./types";

const DEFAULT_PROVIDER: ConversationAiProviderId = "openai";

const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";

export function getConversationAiProviderId(): ConversationAiProviderId {
  const configured = process.env.CONVERSATION_AI_PROVIDER?.trim().toLowerCase();

  if (!configured) {
    return DEFAULT_PROVIDER;
  }

  if (configured !== "openai") {
    throw new ConversationAiError({
      code: "configuration_error",
      message: `Unsupported conversation AI provider: ${configured}`,
    });
  }

  return configured;
}

export function getConversationAiModel(): string {
  return process.env.OPENAI_CONVERSATION_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getConversationAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new ConversationAiError({
      code: "configuration_error",
      provider: "openai",
      message: "The conversation AI service is not configured.",
    });
  }

  return apiKey;
}

import type { ConversationAiMessage } from "./types";

export type ConversationMemoryConfig = {
  maxMessages: number;
  maxCharacters: number;
};

export type ConversationMemoryResult = {
  messages: ConversationAiMessage[];
  originalMessageCount: number;
  selectedMessageCount: number;
  truncated: boolean;
};

export const DEFAULT_CONVERSATION_MEMORY_CONFIG: ConversationMemoryConfig = {
  maxMessages: 24,
  maxCharacters: 12_000,
};

function getMessageCharacterCount(message: ConversationAiMessage): number {
  return message.content.length;
}

function validateMemoryConfig(config: ConversationMemoryConfig): void {
  if (!Number.isInteger(config.maxMessages) || config.maxMessages < 1) {
    throw new Error("Conversation memory maxMessages must be a positive integer.");
  }

  if (!Number.isInteger(config.maxCharacters) || config.maxCharacters < 1) {
    throw new Error("Conversation memory maxCharacters must be a positive integer.");
  }
}

export function selectConversationMemory(
  conversation: ConversationAiMessage[],
  config: ConversationMemoryConfig = DEFAULT_CONVERSATION_MEMORY_CONFIG,
): ConversationMemoryResult {
  validateMemoryConfig(config);

  if (conversation.length === 0) {
    return {
      messages: [],
      originalMessageCount: 0,
      selectedMessageCount: 0,
      truncated: false,
    };
  }

  const selectedReversed: ConversationAiMessage[] = [];

  let selectedCharacters = 0;

  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const message = conversation[index];

    if (!message) {
      continue;
    }

    if (selectedReversed.length >= config.maxMessages) {
      break;
    }

    const messageCharacters = getMessageCharacterCount(message);

    const wouldExceedCharacterBudget =
      selectedCharacters + messageCharacters > config.maxCharacters;

    /*
     * Always preserve the newest message.
     *
     * This is especially important because the newest message should
     * normally be the learner message that triggered the AI response.
     */
    if (wouldExceedCharacterBudget && selectedReversed.length > 0) {
      break;
    }

    selectedReversed.push(message);

    selectedCharacters += messageCharacters;
  }

  const messages = selectedReversed.reverse();

  return {
    messages,
    originalMessageCount: conversation.length,
    selectedMessageCount: messages.length,
    truncated: messages.length < conversation.length,
  };
}

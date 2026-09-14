import { ConversationAiError } from "./types";

const MAX_COACH_RESPONSE_LENGTH = 4_000;

function removeControlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);

      const isAllowedWhitespace = code === 9 || code === 10 || code === 13;

      const isControlCharacter = (code >= 0 && code <= 31) || code === 127;

      return !isControlCharacter || isAllowedWhitespace;
    })
    .join("");
}

export function validateSpeakingCoachOutput(content: string): string {
  const normalized = removeControlCharacters(content).trim();

  if (!normalized) {
    throw new ConversationAiError({
      code: "invalid_response",
      message: "The AI Coach returned an empty response.",
      retryable: true,
    });
  }

  if (normalized.length > MAX_COACH_RESPONSE_LENGTH) {
    throw new ConversationAiError({
      code: "invalid_response",
      message: "The AI Coach returned an unexpectedly long response.",
      retryable: true,
    });
  }

  return normalized;
}

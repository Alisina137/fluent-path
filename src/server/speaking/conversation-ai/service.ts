import type { SpeakingMessage } from "../messages";
import { getSpeakingCoachLearnerContext } from "./learner-context";
import { selectConversationMemory } from "./memory";
import { buildConversationMessages, buildSpeakingCoachSystemPrompt } from "./prompt";
import { getConversationAiProvider } from "./provider-registry";
import { ensureConversationAiProvidersRegistered } from "./providers";
import { normalizeSpeakingScenarioContext, type SpeakingScenarioContext } from "./scenario";
import { validateSpeakingCoachOutput } from "./safety";
import { ConversationAiError, type ConversationAiResult } from "./types";

export type GenerateSpeakingCoachResponseOptions = {
  scenario?: SpeakingScenarioContext | null;
};

export async function generateSpeakingCoachResponse(
  userId: string,
  conversation: SpeakingMessage[],
  options: GenerateSpeakingCoachResponseOptions = {},
): Promise<ConversationAiResult> {
  const normalizedConversation = buildConversationMessages(conversation);

  if (normalizedConversation.length === 0) {
    throw new ConversationAiError({
      code: "generation_failed",
      message: "The AI Coach needs a learner message before responding.",
      retryable: false,
    });
  }

  const lastMessage = normalizedConversation[normalizedConversation.length - 1];

  if (lastMessage?.role !== "user") {
    throw new ConversationAiError({
      code: "generation_failed",
      message: "The AI Coach can only respond after a learner message.",
      retryable: false,
    });
  }

  const memory = selectConversationMemory(normalizedConversation);

  const memoryLastMessage = memory.messages[memory.messages.length - 1];

  if (memoryLastMessage?.role !== "user") {
    throw new ConversationAiError({
      code: "generation_failed",
      message: "The conversation memory did not preserve the learner's latest message.",
      retryable: false,
    });
  }

  const learnerContext = await getSpeakingCoachLearnerContext(userId);

  const scenarioContext = normalizeSpeakingScenarioContext(options.scenario);

  ensureConversationAiProvidersRegistered();

  const provider = getConversationAiProvider();

  const result = await provider.generate({
    systemPrompt: buildSpeakingCoachSystemPrompt({
      englishLevel: learnerContext.englishLevel,
      scenario: scenarioContext,
    }),
    messages: memory.messages,
  });

  return {
    ...result,
    content: validateSpeakingCoachOutput(result.content),
  };
}

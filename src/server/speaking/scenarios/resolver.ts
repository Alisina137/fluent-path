import { getSpeakingCoachLearnerContext } from "@/server/speaking/conversation-ai/learner-context";

import type { SpeakingScenarioContext } from "@/server/speaking/conversation-ai/scenario";

import { findSpeakingScenarioById } from "./service";

import { createSpeakingScenarioContext } from "./context";

export async function resolveSpeakingScenarioForUser(
  userId: string,
  scenarioId: string,
): Promise<SpeakingScenarioContext | null> {
  const scenario = findSpeakingScenarioById(scenarioId);

  if (!scenario) {
    return null;
  }

  const learnerContext = await getSpeakingCoachLearnerContext(userId);

  return createSpeakingScenarioContext(scenario, learnerContext.englishLevel);
}

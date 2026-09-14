import { getSpeakingCoachLearnerContext } from "@/server/speaking/conversation-ai/learner-context";

import type { SpeakingScenarioContext } from "@/server/speaking/conversation-ai/scenario";

import { createSpeakingScenarioContext } from "../context";

import { generateCustomSpeakingScenario } from "./service";

export type ResolvedCustomSpeakingScenario = {
  context: SpeakingScenarioContext;

  scenario: Awaited<ReturnType<typeof generateCustomSpeakingScenario>>["scenario"];

  provider: "openai";

  model: string;

  providerRequestId: string | null;
};

export async function generateCustomSpeakingScenarioForUser(
  userId: string,

  request: string,
): Promise<ResolvedCustomSpeakingScenario> {
  const [learnerContext, generated] = await Promise.all([
    getSpeakingCoachLearnerContext(userId),

    generateCustomSpeakingScenario(request),
  ]);

  const context = createSpeakingScenarioContext(generated.scenario, learnerContext.englishLevel);

  return {
    context,

    scenario: generated.scenario,

    provider: generated.provider,

    model: generated.model,

    providerRequestId: generated.providerRequestId,
  };
}

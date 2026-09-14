import type { SpeakingCoachLearnerLevel } from "@/server/speaking/conversation-ai/cefr";

import type { SpeakingScenarioContext } from "@/server/speaking/conversation-ai/scenario";

import { createSpeakingScenarioDifficultyAdaptation } from "./difficulty";

import type { SpeakingScenarioDefinition } from "./types";

export function createSpeakingScenarioContext(
  scenario: SpeakingScenarioDefinition,
  learnerLevel?: SpeakingCoachLearnerLevel,
): SpeakingScenarioContext {
  const adaptation = learnerLevel
    ? createSpeakingScenarioDifficultyAdaptation(learnerLevel, scenario)
    : null;

  return {
    id: scenario.id,

    title: scenario.title,

    description: scenario.description,

    learnerRole: scenario.learnerRole,

    coachRole: scenario.coachRole,

    objective: scenario.objective,

    setting: scenario.setting,

    adaptation: adaptation
      ? {
          mode: adaptation.mode,

          instructions: adaptation.instructions,
        }
      : null,
  };
}

import type { SpeakingCoachLearnerLevel } from "@/server/speaking/conversation-ai/cefr";

import { getScenarioLevelRelationship } from "./difficulty";

import { listSpeakingScenarios } from "./service";

import type { SpeakingScenarioDefinition } from "./types";

export type SpeakingScenarioRecommendation = {
  scenario: SpeakingScenarioDefinition;

  fit: "recommended" | "easier" | "challenging" | "unknown";
};

export function getSpeakingScenarioRecommendations(
  learnerLevel: SpeakingCoachLearnerLevel,
): SpeakingScenarioRecommendation[] {
  const scenarios = listSpeakingScenarios();

  return scenarios.map((scenario) => {
    const relationship = getScenarioLevelRelationship(learnerLevel, scenario);

    if (relationship === "within_range") {
      return {
        scenario,
        fit: "recommended",
      };
    }

    if (relationship === "above_range") {
      return {
        scenario,
        fit: "easier",
      };
    }

    if (relationship === "below_range") {
      return {
        scenario,
        fit: "challenging",
      };
    }

    return {
      scenario,
      fit: "unknown",
    };
  });
}

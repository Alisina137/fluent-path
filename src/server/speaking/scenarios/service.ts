import type { SpeakingCoachLearnerLevel } from "@/server/speaking/conversation-ai/cefr";

import type { SpeakingScenarioContext } from "@/server/speaking/conversation-ai/scenario";

import { createSpeakingScenarioContext } from "./context";

import {
  filterSpeakingScenarioLibrary,
  getSpeakingScenarioById,
  getSpeakingScenarioBySlug,
  getSpeakingScenarioLibrary,
  type SpeakingScenarioLibraryFilter,
} from "./library";

import type { SpeakingScenarioDefinition } from "./types";

export function listSpeakingScenarios(
  filter?: SpeakingScenarioLibraryFilter,
): SpeakingScenarioDefinition[] {
  if (!filter) {
    return getSpeakingScenarioLibrary().filter((scenario) => scenario.active);
  }

  return filterSpeakingScenarioLibrary(filter);
}

export function findSpeakingScenarioById(id: string): SpeakingScenarioDefinition | null {
  const scenario = getSpeakingScenarioById(id);

  if (!scenario || !scenario.active) {
    return null;
  }

  return scenario;
}

export function findSpeakingScenarioBySlug(slug: string): SpeakingScenarioDefinition | null {
  const scenario = getSpeakingScenarioBySlug(slug);

  if (!scenario || !scenario.active) {
    return null;
  }

  return scenario;
}

export function resolveSpeakingScenarioContextById(
  id: string,
  learnerLevel?: SpeakingCoachLearnerLevel,
): SpeakingScenarioContext | null {
  const scenario = findSpeakingScenarioById(id);

  if (!scenario) {
    return null;
  }

  return createSpeakingScenarioContext(scenario, learnerLevel);
}

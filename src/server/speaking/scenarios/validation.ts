import {
  speakingScenarioDefinitionSchema,
  type ValidatedSpeakingScenarioDefinition,
} from "./schema";

import type { SpeakingScenarioDefinition } from "./types";

export function validateSpeakingScenarioDefinition(
  scenario: SpeakingScenarioDefinition,
): ValidatedSpeakingScenarioDefinition {
  return speakingScenarioDefinitionSchema.parse(scenario);
}

export function validateSpeakingScenarioDefinitions(
  scenarios: SpeakingScenarioDefinition[],
): ValidatedSpeakingScenarioDefinition[] {
  const seenIds = new Set<string>();

  const seenSlugs = new Set<string>();

  const validated = scenarios.map(validateSpeakingScenarioDefinition);

  for (const scenario of validated) {
    if (seenIds.has(scenario.id)) {
      throw new Error(`Duplicate speaking scenario id: ${scenario.id}`);
    }

    if (seenSlugs.has(scenario.slug)) {
      throw new Error(`Duplicate speaking scenario slug: ${scenario.slug}`);
    }

    seenIds.add(scenario.id);

    seenSlugs.add(scenario.slug);
  }

  return validated;
}

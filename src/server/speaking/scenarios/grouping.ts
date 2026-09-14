import { speakingScenarioCategories, type SpeakingScenarioCategoryDefinition } from "./categories";

import { filterSpeakingScenarioLibrary } from "./library";

import type { SpeakingScenarioDefinition } from "./types";

export type SpeakingScenarioCategoryGroup = {
  category: SpeakingScenarioCategoryDefinition;
  scenarios: SpeakingScenarioDefinition[];
};

export function getSpeakingScenariosGroupedByCategory(): SpeakingScenarioCategoryGroup[] {
  return speakingScenarioCategories
    .map((category) => ({
      category,
      scenarios: filterSpeakingScenarioLibrary({
        category: category.id,
        activeOnly: true,
      }),
    }))
    .filter((group) => group.scenarios.length > 0);
}

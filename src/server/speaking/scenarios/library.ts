import { speakingScenarioLibraryData } from "./library-data";
import type {
  SpeakingScenarioCategory,
  SpeakingScenarioCefrLevel,
  SpeakingScenarioDifficulty,
} from "./taxonomy";
import { isSpeakingScenarioAvailableForCefrLevel } from "./taxonomy";
import type { SpeakingScenarioDefinition } from "./types";
import { validateSpeakingScenarioDefinitions } from "./validation";

const validatedScenarioLibrary = validateSpeakingScenarioDefinitions(speakingScenarioLibraryData);

export type SpeakingScenarioLibraryFilter = {
  category?: SpeakingScenarioCategory;
  difficulty?: SpeakingScenarioDifficulty;
  cefrLevel?: SpeakingScenarioCefrLevel;
  activeOnly?: boolean;
};

export function getSpeakingScenarioLibrary(): SpeakingScenarioDefinition[] {
  return validatedScenarioLibrary.map((scenario) => ({
    ...scenario,
    skills: [...scenario.skills],
    tags: [...scenario.tags],
    cefrRange: {
      ...scenario.cefrRange,
    },
  }));
}

export function getSpeakingScenarioById(id: string): SpeakingScenarioDefinition | null {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return null;
  }

  const scenario = validatedScenarioLibrary.find((candidate) => candidate.id === normalizedId);

  if (!scenario) {
    return null;
  }

  return {
    ...scenario,
    skills: [...scenario.skills],
    tags: [...scenario.tags],
    cefrRange: {
      ...scenario.cefrRange,
    },
  };
}

export function getSpeakingScenarioBySlug(slug: string): SpeakingScenarioDefinition | null {
  const normalizedSlug = slug.trim().toLowerCase();

  if (!normalizedSlug) {
    return null;
  }

  const scenario = validatedScenarioLibrary.find((candidate) => candidate.slug === normalizedSlug);

  if (!scenario) {
    return null;
  }

  return {
    ...scenario,
    skills: [...scenario.skills],
    tags: [...scenario.tags],
    cefrRange: {
      ...scenario.cefrRange,
    },
  };
}

export function filterSpeakingScenarioLibrary(
  filter: SpeakingScenarioLibraryFilter = {},
): SpeakingScenarioDefinition[] {
  const { category, difficulty, cefrLevel, activeOnly = true } = filter;

  return validatedScenarioLibrary
    .filter((scenario) => !activeOnly || scenario.active)
    .filter((scenario) => !category || scenario.category === category)
    .filter((scenario) => !difficulty || scenario.difficulty === difficulty)
    .filter(
      (scenario) =>
        !cefrLevel || isSpeakingScenarioAvailableForCefrLevel(cefrLevel, scenario.cefrRange),
    )
    .map((scenario) => ({
      ...scenario,
      skills: [...scenario.skills],
      tags: [...scenario.tags],
      cefrRange: {
        ...scenario.cefrRange,
      },
    }));
}

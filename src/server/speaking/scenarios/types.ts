import type {
  SpeakingScenarioCategory,
  SpeakingScenarioCefrRange,
  SpeakingScenarioConversationType,
  SpeakingScenarioDifficulty,
  SpeakingScenarioSkill,
} from "./taxonomy";

export type SpeakingScenarioDefinition = {
  id: string;
  slug: string;
  title: string;
  description: string;

  category: SpeakingScenarioCategory;

  difficulty: SpeakingScenarioDifficulty;

  cefrRange: SpeakingScenarioCefrRange;

  conversationType: SpeakingScenarioConversationType;

  learnerRole: string | null;

  coachRole: string | null;

  objective: string;

  setting: string | null;

  skills: SpeakingScenarioSkill[];

  suggestedOpening: string | null;

  tags: string[];

  estimatedMinutes: number;

  active: boolean;
};

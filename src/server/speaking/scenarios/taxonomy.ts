export const SPEAKING_SCENARIO_CATEGORIES = [
  "daily_life",
  "travel",
  "work",
  "education",
  "social",
  "shopping_services",
  "health_wellness",
  "problem_solving",
  "public_situations",
  "free_conversation",
] as const;

export type SpeakingScenarioCategory = (typeof SPEAKING_SCENARIO_CATEGORIES)[number];

export const SPEAKING_SCENARIO_DIFFICULTIES = [
  "beginner",
  "elementary",
  "intermediate",
  "upper_intermediate",
  "advanced",
] as const;

export type SpeakingScenarioDifficulty = (typeof SPEAKING_SCENARIO_DIFFICULTIES)[number];

export const SPEAKING_SCENARIO_CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type SpeakingScenarioCefrLevel = (typeof SPEAKING_SCENARIO_CEFR_LEVELS)[number];

export const SPEAKING_SCENARIO_CONVERSATION_TYPES = [
  "role_play",
  "guided_conversation",
  "open_discussion",
  "problem_solving",
  "simulation",
] as const;

export type SpeakingScenarioConversationType =
  (typeof SPEAKING_SCENARIO_CONVERSATION_TYPES)[number];

export const SPEAKING_SCENARIO_SKILLS = [
  "asking_questions",
  "answering_questions",
  "describing",
  "explaining",
  "requesting",
  "clarifying",
  "agreeing_disagreeing",
  "giving_opinions",
  "making_suggestions",
  "negotiating",
  "problem_solving",
  "storytelling",
  "small_talk",
  "professional_communication",
] as const;

export type SpeakingScenarioSkill = (typeof SPEAKING_SCENARIO_SKILLS)[number];

export type SpeakingScenarioCefrRange = {
  min: SpeakingScenarioCefrLevel;
  max: SpeakingScenarioCefrLevel;
};

export const SPEAKING_SCENARIO_CATEGORY_LABELS: Record<SpeakingScenarioCategory, string> = {
  daily_life: "Daily Life",
  travel: "Travel",
  work: "Work",
  education: "Education",
  social: "Social",
  shopping_services: "Shopping & Services",
  health_wellness: "Health & Wellness",
  problem_solving: "Problem Solving",
  public_situations: "Public Situations",
  free_conversation: "Free Conversation",
};

export const SPEAKING_SCENARIO_DIFFICULTY_LABELS: Record<SpeakingScenarioDifficulty, string> = {
  beginner: "Beginner",
  elementary: "Elementary",
  intermediate: "Intermediate",
  upper_intermediate: "Upper Intermediate",
  advanced: "Advanced",
};

const CEFR_ORDER: Record<SpeakingScenarioCefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export function isValidSpeakingScenarioCefrRange(range: SpeakingScenarioCefrRange): boolean {
  return CEFR_ORDER[range.min] <= CEFR_ORDER[range.max];
}

export function isSpeakingScenarioAvailableForCefrLevel(
  level: SpeakingScenarioCefrLevel,
  range: SpeakingScenarioCefrRange,
): boolean {
  const value = CEFR_ORDER[level];

  return value >= CEFR_ORDER[range.min] && value <= CEFR_ORDER[range.max];
}

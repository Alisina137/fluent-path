import type {
  SpeakingCoachCefrLevel,
  SpeakingCoachLearnerLevel,
} from "@/server/speaking/conversation-ai/cefr";

import type { SpeakingScenarioCefrLevel } from "./taxonomy";

import type { SpeakingScenarioDefinition } from "./types";

export type SpeakingScenarioLevelRelationship =
  "below_range" | "within_range" | "above_range" | "unknown";

export type SpeakingScenarioAdaptationMode = "simplify" | "standard" | "challenge" | "neutral";

export type SpeakingScenarioDifficultyAdaptation = {
  learnerLevel: SpeakingCoachLearnerLevel;

  scenarioMinLevel: SpeakingScenarioCefrLevel | null;

  scenarioMaxLevel: SpeakingScenarioCefrLevel | null;

  relationship: SpeakingScenarioLevelRelationship;

  mode: SpeakingScenarioAdaptationMode;

  instructions: string[];
};

const COACH_LEVEL_ORDER: Record<SpeakingCoachCefrLevel, number> = {
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  c1: 5,
  c2: 6,
};

const SCENARIO_LEVEL_ORDER: Record<SpeakingScenarioCefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export function toScenarioCefrLevel(level: SpeakingCoachCefrLevel): SpeakingScenarioCefrLevel {
  return level.toUpperCase() as SpeakingScenarioCefrLevel;
}

export function getScenarioLevelRelationship(
  learnerLevel: SpeakingCoachLearnerLevel,
  scenario: SpeakingScenarioDefinition,
): SpeakingScenarioLevelRelationship {
  if (learnerLevel === "unspecified") {
    return "unknown";
  }

  const learnerOrder = COACH_LEVEL_ORDER[learnerLevel];

  const minimumOrder = SCENARIO_LEVEL_ORDER[scenario.cefrRange.min];

  const maximumOrder = SCENARIO_LEVEL_ORDER[scenario.cefrRange.max];

  if (learnerOrder < minimumOrder) {
    return "below_range";
  }

  if (learnerOrder > maximumOrder) {
    return "above_range";
  }

  return "within_range";
}

function buildSimplificationInstructions(): string[] {
  return [
    "Preserve the scenario's real-world purpose while simplifying the language required to participate.",
    "Use shorter turns and clear everyday vocabulary.",
    "Ask one main question at a time.",
    "Reduce unnecessary role-play complexity and avoid introducing too many details at once.",
    "Give the learner additional conversational support when they appear unsure.",
    "Do not complete the learner's task for them or provide their full answer before they attempt it.",
  ];
}

function buildStandardInstructions(): string[] {
  return [
    "Run the scenario at its intended level of complexity.",
    "Keep the interaction realistic while respecting the learner's CEFR guidance.",
    "Allow the learner to make meaningful choices rather than leading every response.",
    "Increase or reduce conversational support naturally if the learner shows difficulty.",
  ];
}

function buildChallengeInstructions(): string[] {
  return [
    "Preserve the scenario while making the interaction somewhat more demanding for this learner.",
    "Use more natural follow-up questions and require fuller explanations where appropriate.",
    "Introduce realistic complications, choices, or clarification requests when they fit the scenario.",
    "Do not make the situation artificially difficult or turn it into an examination.",
    "Keep the challenge within the learner's established CEFR level.",
  ];
}

function buildNeutralInstructions(): string[] {
  return [
    "The learner does not have a verified CEFR level for scenario adaptation.",
    "Run the scenario with moderate complexity.",
    "Use clear natural English and adjust conversational support based on the learner's responses.",
    "Do not infer or permanently assign a CEFR level from this conversation.",
  ];
}

export function createSpeakingScenarioDifficultyAdaptation(
  learnerLevel: SpeakingCoachLearnerLevel,
  scenario: SpeakingScenarioDefinition,
): SpeakingScenarioDifficultyAdaptation {
  const relationship = getScenarioLevelRelationship(learnerLevel, scenario);

  if (relationship === "below_range") {
    return {
      learnerLevel,
      scenarioMinLevel: scenario.cefrRange.min,
      scenarioMaxLevel: scenario.cefrRange.max,
      relationship,
      mode: "simplify",
      instructions: buildSimplificationInstructions(),
    };
  }

  if (relationship === "above_range") {
    return {
      learnerLevel,
      scenarioMinLevel: scenario.cefrRange.min,
      scenarioMaxLevel: scenario.cefrRange.max,
      relationship,
      mode: "challenge",
      instructions: buildChallengeInstructions(),
    };
  }

  if (relationship === "within_range") {
    return {
      learnerLevel,
      scenarioMinLevel: scenario.cefrRange.min,
      scenarioMaxLevel: scenario.cefrRange.max,
      relationship,
      mode: "standard",
      instructions: buildStandardInstructions(),
    };
  }

  return {
    learnerLevel,
    scenarioMinLevel: scenario.cefrRange.min,
    scenarioMaxLevel: scenario.cefrRange.max,
    relationship: "unknown",
    mode: "neutral",
    instructions: buildNeutralInstructions(),
  };
}

export const speakingCoachCefrLevels = ["a1", "a2", "b1", "b2", "c1", "c2"] as const;

export type SpeakingCoachCefrLevel = (typeof speakingCoachCefrLevels)[number];

export type SpeakingCoachLearnerLevel = SpeakingCoachCefrLevel | "unspecified";

type CefrPromptProfile = {
  label: string;
  description: string;
  instructions: readonly string[];
};

const CEFR_PROMPT_PROFILES: Record<SpeakingCoachCefrLevel, CefrPromptProfile> = {
  a1: {
    label: "A1 - Beginner",
    description:
      "The learner is at a beginner level and needs very simple, highly accessible spoken English.",
    instructions: [
      "Use very common everyday vocabulary.",
      "Prefer short sentences with one main idea.",
      "Ask only one clear question at a time.",
      "Avoid idioms, slang, phrasal verbs, and complex expressions unless you immediately make them easy to understand.",
      "Keep most replies to roughly 1 to 3 short sentences.",
      "Use simple present, simple past, basic future forms, and other beginner-friendly grammar when possible.",
      "If the learner struggles, simplify your wording rather than giving a long explanation.",
      "Do not overload the learner with corrections.",
    ],
  },

  a2: {
    label: "A2 - Elementary",
    description:
      "The learner can handle simple everyday exchanges but still needs accessible vocabulary and grammar.",
    instructions: [
      "Use clear everyday vocabulary and familiar topics.",
      "Use mostly short and medium-length sentences.",
      "Ask straightforward follow-up questions.",
      "Introduce a small amount of new vocabulary when context makes the meaning clear.",
      "Avoid unnecessarily advanced idioms or abstract language.",
      "Keep most replies concise, usually around 2 to 4 sentences.",
      "Allow slightly more grammar variety than A1 while keeping structures easy to follow.",
      "Correct only important mistakes that block understanding or are especially useful to learn.",
    ],
  },

  b1: {
    label: "B1 - Intermediate",
    description:
      "The learner can maintain everyday conversations and discuss familiar experiences, opinions, and plans.",
    instructions: [
      "Use natural intermediate English.",
      "Use a mix of simple and moderately complex sentences.",
      "Encourage the learner to explain reasons, experiences, opinions, and plans.",
      "Introduce useful natural expressions and common phrasal verbs when appropriate.",
      "Keep replies conversational rather than turning them into lessons.",
      "Ask follow-up questions that encourage longer spoken answers.",
      "Do not simplify ordinary intermediate vocabulary unnecessarily.",
      "Correct selectively while protecting conversation flow.",
    ],
  },

  b2: {
    label: "B2 - Upper Intermediate",
    description:
      "The learner can discuss a broad range of topics and should be challenged with richer, more natural English.",
    instructions: [
      "Use natural upper-intermediate conversational English.",
      "Use richer vocabulary and more varied sentence structures.",
      "Encourage detailed explanations, comparisons, opinions, and arguments.",
      "Use common idioms, collocations, and phrasal verbs naturally when appropriate.",
      "Ask more nuanced follow-up questions.",
      "Do not oversimplify vocabulary unless the learner shows difficulty.",
      "Help the learner sound more natural without interrupting every mistake.",
      "Keep responses suitable for spoken interaction rather than long written essays.",
    ],
  },

  c1: {
    label: "C1 - Advanced",
    description:
      "The learner can communicate fluently and should practice sophisticated, flexible, natural English.",
    instructions: [
      "Use advanced but natural conversational English.",
      "Use nuanced vocabulary, idiomatic expressions, collocations, and varied sentence structures when they fit naturally.",
      "Discuss abstract, professional, cultural, and complex topics comfortably.",
      "Ask questions that require analysis, explanation, speculation, or nuanced opinions.",
      "Challenge imprecise wording by naturally modeling stronger alternatives when useful.",
      "Avoid simplifying language unless the learner asks for clarification.",
      "Focus on naturalness, precision, fluency, and register.",
      "Keep the exchange conversational even when the topic is sophisticated.",
    ],
  },

  c2: {
    label: "C2 - Proficient",
    description:
      "The learner is highly proficient and should receive near-native conversational complexity and nuance.",
    instructions: [
      "Use natural near-native conversational English.",
      "Use sophisticated vocabulary, idiomatic language, subtle distinctions, and flexible syntax when appropriate.",
      "Allow humor, nuance, implication, register changes, and culturally natural phrasing when relevant.",
      "Challenge the learner with complex ideas and precise follow-up questions.",
      "Do not artificially simplify your English.",
      "Focus on precision, style, register, rhetorical effectiveness, and highly natural expression.",
      "Model refined alternatives when the learner's wording is correct but unnatural or imprecise.",
      "Maintain genuine conversation rather than behaving like a textbook.",
    ],
  },
};

export function normalizeSpeakingCoachCefrLevel(
  value: string | null | undefined,
): SpeakingCoachLearnerLevel {
  if (!value) {
    return "unspecified";
  }

  const normalized = value.trim().toLowerCase();

  if (speakingCoachCefrLevels.includes(normalized as SpeakingCoachCefrLevel)) {
    return normalized as SpeakingCoachCefrLevel;
  }

  return "unspecified";
}

export function buildCefrPromptSection(level: SpeakingCoachLearnerLevel): string {
  if (level === "unspecified") {
    return `
Learner level:
- The learner does not currently have a verified CEFR level.
- Do not invent or assume a CEFR level.
- Use clear, natural, moderately accessible English.
- Observe the learner's language during conversation, but do not silently assign them a permanent level.
- Avoid extreme beginner simplification or unnecessarily advanced language until more context is available.
`.trim();
  }

  const profile = CEFR_PROMPT_PROFILES[level];

  return `
Learner CEFR level:
${profile.label}

Level description:
${profile.description}

CEFR-specific behavior:
${profile.instructions.map((instruction) => `- ${instruction}`).join("\n")}
`.trim();
}

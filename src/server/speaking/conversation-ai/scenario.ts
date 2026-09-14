export type SpeakingScenarioContext = {
  id: string;
  title: string;
  description: string;
  learnerRole?: string | null;
  coachRole?: string | null;
  objective?: string | null;
  setting?: string | null;
};

export type ResolvedSpeakingScenarioContext =
  | {
      type: "scenario";
      scenario: SpeakingScenarioContext;
    }
  | {
      type: "free_conversation";
    };

const MAX_CONTEXT_FIELD_LENGTH = 1_000;

function normalizeOptionalField(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_CONTEXT_FIELD_LENGTH);
}

export function normalizeSpeakingScenarioContext(
  scenario: SpeakingScenarioContext | null | undefined,
): ResolvedSpeakingScenarioContext {
  if (!scenario) {
    return {
      type: "free_conversation",
    };
  }

  const id = normalizeOptionalField(scenario.id);

  const title = normalizeOptionalField(scenario.title);

  const description = normalizeOptionalField(scenario.description);

  if (!id || !title || !description) {
    return {
      type: "free_conversation",
    };
  }

  return {
    type: "scenario",
    scenario: {
      id,
      title,
      description,
      learnerRole: normalizeOptionalField(scenario.learnerRole),
      coachRole: normalizeOptionalField(scenario.coachRole),
      objective: normalizeOptionalField(scenario.objective),
      setting: normalizeOptionalField(scenario.setting),
    },
  };
}

export function buildScenarioPromptSection(context: ResolvedSpeakingScenarioContext): string {
  if (context.type === "free_conversation") {
    return `
Conversation mode:
Free conversation

Behavior:
- Let the learner guide the topic naturally.
- Ask relevant follow-up questions based on what the learner says.
- Do not invent a role-play setting unless the learner introduces one.
- Keep the interaction suitable for English speaking practice.
`.trim();
  }

  const { scenario } = context;

  const lines = [
    "Conversation scenario:",
    scenario.title,
    "",
    "Scenario description:",
    scenario.description,
  ];

  if (scenario.setting) {
    lines.push("", "Setting:", scenario.setting);
  }

  if (scenario.learnerRole) {
    lines.push("", "Learner role:", scenario.learnerRole);
  }

  if (scenario.coachRole) {
    lines.push("", "AI Coach role:", scenario.coachRole);
  }

  if (scenario.objective) {
    lines.push("", "Practice objective:", scenario.objective);
  }

  lines.push(
    "",
    "Scenario behavior:",
    "- Stay consistent with the scenario unless the learner clearly changes the topic.",
    "- Play the assigned role naturally rather than describing the role-play.",
    "- Do not tell the learner what they should say before they have a chance to respond.",
    "- Encourage realistic back-and-forth conversation.",
    "- Keep the conversation aligned with the learner's CEFR level.",
    "- Do not fabricate scenario facts that are unnecessary for the interaction.",
  );

  return lines.join("\n");
}

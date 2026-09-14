import { randomUUID } from "node:crypto";

import { validateSpeakingScenarioDefinition } from "../validation";

import type { SpeakingScenarioDefinition } from "../types";

import { generateCustomScenarioWithOpenAi } from "./openai";

import { CustomSpeakingScenarioError, type GeneratedCustomSpeakingScenario } from "./types";

const MIN_REQUEST_LENGTH = 10;

const MAX_REQUEST_LENGTH = 2_000;

function normalizeRequest(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function createSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || "custom-scenario";
}

export async function generateCustomSpeakingScenario(
  request: string,
): Promise<GeneratedCustomSpeakingScenario> {
  const normalizedRequest = normalizeRequest(request);

  if (
    normalizedRequest.length < MIN_REQUEST_LENGTH ||
    normalizedRequest.length > MAX_REQUEST_LENGTH
  ) {
    throw new CustomSpeakingScenarioError({
      code: "invalid_request",

      message: "Describe your custom speaking scenario in 10 to 2000 characters.",

      retryable: false,
    });
  }

  const generated = await generateCustomScenarioWithOpenAi(normalizedRequest);

  const scenario: SpeakingScenarioDefinition = {
    id: `custom-${randomUUID()}`,

    slug: `${createSlug(generated.payload.title)}-${randomUUID().slice(0, 8)}`,

    title: generated.payload.title,

    description: generated.payload.description,

    category: generated.payload.category,

    difficulty: generated.payload.difficulty,

    cefrRange: generated.payload.cefrRange,

    conversationType: generated.payload.conversationType,

    learnerRole: generated.payload.learnerRole,

    coachRole: generated.payload.coachRole,

    objective: generated.payload.objective,

    setting: generated.payload.setting,

    skills: generated.payload.skills,

    suggestedOpening: generated.payload.suggestedOpening,

    tags: generated.payload.tags,

    estimatedMinutes: generated.payload.estimatedMinutes,

    active: true,
  };

  const validated = validateSpeakingScenarioDefinition(scenario);

  return {
    scenario: validated,

    provider: "openai",

    model: generated.model,

    providerRequestId: generated.requestId,
  };
}

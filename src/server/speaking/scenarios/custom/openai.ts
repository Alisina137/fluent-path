import {
  getConversationAiApiKey,
  getConversationAiModel,
} from "@/server/speaking/conversation-ai/config";

import { generatedCustomScenarioSchema, type GeneratedCustomScenarioPayload } from "./schema";

import { CustomSpeakingScenarioError } from "./types";

import { buildCustomScenarioGenerationPrompt } from "./prompt";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const REQUEST_TIMEOUT_MS = 45_000;

const CUSTOM_SCENARIO_JSON_SCHEMA = {
  type: "object",

  additionalProperties: false,

  required: [
    "title",
    "description",
    "category",
    "difficulty",
    "cefrRange",
    "conversationType",
    "learnerRole",
    "coachRole",
    "objective",
    "setting",
    "skills",
    "suggestedOpening",
    "tags",
    "estimatedMinutes",
  ],

  properties: {
    title: {
      type: "string",
    },

    description: {
      type: "string",
    },

    category: {
      type: "string",

      enum: [
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
      ],
    },

    difficulty: {
      type: "string",

      enum: ["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"],
    },

    cefrRange: {
      type: "object",

      additionalProperties: false,

      required: ["min", "max"],

      properties: {
        min: {
          type: "string",

          enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
        },

        max: {
          type: "string",

          enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
        },
      },
    },

    conversationType: {
      type: "string",

      enum: [
        "role_play",
        "guided_conversation",
        "open_discussion",
        "problem_solving",
        "simulation",
      ],
    },

    learnerRole: {
      type: ["string", "null"],
    },

    coachRole: {
      type: ["string", "null"],
    },

    objective: {
      type: "string",
    },

    setting: {
      type: ["string", "null"],
    },

    skills: {
      type: "array",

      items: {
        type: "string",

        enum: [
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
        ],
      },
    },

    suggestedOpening: {
      type: ["string", "null"],
    },

    tags: {
      type: "array",

      items: {
        type: "string",
      },
    },

    estimatedMinutes: {
      type: "integer",
    },
  },
} as const;

type OpenAiResponse = {
  id?: string;

  output_text?: string;
};

export async function generateCustomScenarioWithOpenAi(request: string): Promise<{
  payload: GeneratedCustomScenarioPayload;

  model: string;

  requestId: string | null;
}> {
  const apiKey = getConversationAiApiKey();

  const model = getConversationAiModel();

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,

        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model,

        input: buildCustomScenarioGenerationPrompt(request),

        max_output_tokens: 2_000,

        text: {
          format: {
            type: "json_schema",

            name: "custom_speaking_scenario",

            strict: true,

            schema: CUSTOM_SCENARIO_JSON_SCHEMA,
          },
        },
      }),

      signal: controller.signal,
    });

    const requestId = response.headers.get("x-request-id");

    if (response.status === 401) {
      throw new CustomSpeakingScenarioError({
        code: "authentication_failed",

        message: "Custom scenario generation could not authenticate with the AI provider.",

        retryable: false,
      });
    }

    if (response.status === 429) {
      throw new CustomSpeakingScenarioError({
        code: "rate_limited",

        message: "Custom scenario generation is temporarily rate limited.",

        retryable: true,
      });
    }

    if (!response.ok) {
      throw new CustomSpeakingScenarioError({
        code: "provider_unavailable",

        message: "The AI provider could not generate the custom scenario.",

        retryable: response.status >= 500,
      });
    }

    const result = (await response.json()) as OpenAiResponse;

    if (!result.output_text) {
      throw new CustomSpeakingScenarioError({
        code: "invalid_response",

        message: "The AI provider returned an empty custom scenario.",

        retryable: true,
      });
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(result.output_text);
    } catch (error) {
      throw new CustomSpeakingScenarioError({
        code: "invalid_response",

        message: "The generated custom scenario was not valid JSON.",

        retryable: true,

        cause: error,
      });
    }

    const validation = generatedCustomScenarioSchema.safeParse(parsed);

    if (!validation.success) {
      throw new CustomSpeakingScenarioError({
        code: "invalid_response",

        message: "The generated custom scenario did not match the required structure.",

        retryable: true,

        cause: validation.error,
      });
    }

    return {
      payload: validation.data,

      model,

      requestId: requestId ?? result.id ?? null,
    };
  } catch (error) {
    if (error instanceof CustomSpeakingScenarioError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new CustomSpeakingScenarioError({
        code: "provider_unavailable",

        message: "Custom scenario generation timed out.",

        retryable: true,

        cause: error,
      });
    }

    throw new CustomSpeakingScenarioError({
      code: "generation_failed",

      message: "Custom scenario generation failed.",

      retryable: true,

      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

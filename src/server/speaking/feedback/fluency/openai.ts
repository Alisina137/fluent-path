import {
  getConversationAiApiKey,
  getConversationAiModel,
} from "@/server/speaking/conversation-ai/config";

import { buildFluencyEvaluationInstructions } from "./prompt";

import { fluencyAiEvaluationSchema } from "./schema";

import { FluencyEvaluationError, type FluencyAiEvaluation } from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const REQUEST_TIMEOUT_MS = 45_000;

const MAX_FLUENCY_TEXT_LENGTH = 10_000;

const fluencyJsonSchema = {
  type: "object",

  additionalProperties: false,

  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    level: {
      type: "string",
      enum: ["limited", "developing", "functional", "smooth"],
    },

    summary: {
      type: "string",
    },

    improvementTip: {
      type: "string",
    },

    strengths: {
      type: "array",

      maxItems: 8,

      items: {
        type: "object",

        additionalProperties: false,

        properties: {
          evidence: {
            type: "string",
          },

          explanation: {
            type: "string",
          },
        },

        required: ["evidence", "explanation"],
      },
    },

    issues: {
      type: "array",

      maxItems: 20,

      items: {
        type: "object",

        additionalProperties: false,

        properties: {
          category: {
            type: "string",

            enum: [
              "fragmentation",
              "repetition",
              "filler_usage",
              "discourse_flow",
              "idea_development",
              "other",
            ],
          },

          severity: {
            type: "string",

            enum: ["minor", "medium", "major"],
          },

          evidence: {
            type: "string",
          },

          suggestion: {
            type: "string",
          },

          explanation: {
            type: "string",
          },
        },

        required: ["category", "severity", "evidence", "suggestion", "explanation"],
      },
    },
  },

  required: ["score", "level", "summary", "improvementTip", "strengths", "issues"],
} as const;

type OpenAiOutputText = {
  type?: unknown;
  text?: unknown;
};

type OpenAiOutputItem = {
  type?: unknown;
  content?: unknown;
};

type OpenAiResponse = {
  output?: unknown;
};

function normalizeText(text: string): string {
  const normalized = text.trim();

  if (!normalized) {
    throw new FluencyEvaluationError({
      code: "invalid_text",
      retryable: false,

      message: "Fluency evaluation text cannot be empty.",
    });
  }

  if (normalized.length > MAX_FLUENCY_TEXT_LENGTH) {
    throw new FluencyEvaluationError({
      code: "invalid_text",
      retryable: false,

      message: "Fluency evaluation text is too long.",
    });
  }

  return normalized;
}

function extractOutputText(payload: OpenAiResponse): string {
  if (!Array.isArray(payload.output)) {
    throw new FluencyEvaluationError({
      code: "invalid_response",

      retryable: true,

      message: "The fluency evaluation service returned an invalid response.",
    });
  }

  const parts: string[] = [];

  for (const item of payload.output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const outputItem = item as OpenAiOutputItem;

    if (outputItem.type !== "message" || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const textItem = contentItem as OpenAiOutputText;

      if (textItem.type === "output_text" && typeof textItem.text === "string") {
        parts.push(textItem.text);
      }
    }
  }

  const text = parts.join("\n").trim();

  if (!text) {
    throw new FluencyEvaluationError({
      code: "invalid_response",

      retryable: true,

      message: "The fluency evaluation service returned an empty response.",
    });
  }

  return text;
}

function mapOpenAiStatus(status: number): FluencyEvaluationError {
  if (status === 401 || status === 403) {
    return new FluencyEvaluationError({
      code: "authentication_failed",

      retryable: false,

      message: "The fluency evaluation service is not authorized.",
    });
  }

  if (status === 429) {
    return new FluencyEvaluationError({
      code: "rate_limited",

      retryable: true,

      message: "The fluency evaluation service is busy. Please try again shortly.",
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new FluencyEvaluationError({
      code: "provider_unavailable",

      retryable: true,

      message: "The fluency evaluation service is temporarily unavailable.",
    });
  }

  return new FluencyEvaluationError({
    code: "evaluation_failed",

    retryable: false,

    message: "Fluency evaluation could not be completed.",
  });
}

export async function evaluateFluencyWithOpenAi(text: string): Promise<{
  evaluation: FluencyAiEvaluation;
  provider: "openai";
  model: string;
  providerRequestId: string | null;
}> {
  const normalized = normalizeText(text);

  const apiKey = getConversationAiApiKey();

  const model = getConversationAiModel();

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,

        "Content-Type": "application/json",
      },

      signal: controller.signal,

      body: JSON.stringify({
        model,

        instructions: buildFluencyEvaluationInstructions(),

        input: [
          {
            role: "user",

            content: [
              {
                type: "input_text",

                text: normalized,
              },
            ],
          },
        ],

        text: {
          format: {
            type: "json_schema",

            name: "fluency_evaluation",

            description: "Transcript-based structured fluency feedback for an English learner.",

            strict: true,

            schema: fluencyJsonSchema,
          },
        },

        max_output_tokens: 1500,
      }),
    });
  } catch (error) {
    throw new FluencyEvaluationError({
      code: "provider_unavailable",

      retryable: true,

      message: "The fluency evaluation service could not be reached.",

      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw mapOpenAiStatus(response.status);
  }

  let payload: OpenAiResponse;

  try {
    payload = (await response.json()) as OpenAiResponse;
  } catch (error) {
    throw new FluencyEvaluationError({
      code: "invalid_response",

      retryable: true,

      message: "The fluency evaluation service returned invalid data.",

      cause: error,
    });
  }

  const outputText = extractOutputText(payload);

  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    throw new FluencyEvaluationError({
      code: "invalid_response",

      retryable: true,

      message: "The fluency evaluation service returned malformed structured data.",

      cause: error,
    });
  }

  const validated = fluencyAiEvaluationSchema.safeParse(parsed);

  if (!validated.success) {
    throw new FluencyEvaluationError({
      code: "invalid_response",

      retryable: true,

      message: "The fluency evaluation response did not match the expected format.",

      cause: validated.error,
    });
  }

  return {
    evaluation: validated.data,

    provider: "openai",

    model,

    providerRequestId: response.headers.get("x-request-id"),
  };
}

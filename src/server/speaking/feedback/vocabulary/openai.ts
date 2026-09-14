import {
  getConversationAiApiKey,
  getConversationAiModel,
} from "@/server/speaking/conversation-ai/config";

import { buildVocabularyEvaluationInstructions } from "./prompt";
import { vocabularyEvaluationSchema } from "./schema";
import {
  VocabularyEvaluationError,
  type VocabularyEvaluationRequest,
  type VocabularyEvaluationResult,
} from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const REQUEST_TIMEOUT_MS = 45_000;

const MAX_VOCABULARY_TEXT_LENGTH = 10_000;

const vocabularyEvaluationJsonSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    range: {
      type: "string",
      enum: ["basic", "developing", "good", "strong"],
    },

    isAppropriate: {
      type: "boolean",
    },

    summary: {
      type: "string",
    },

    suggestedText: {
      type: "string",
    },

    strengths: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          expression: {
            type: "string",
          },

          explanation: {
            type: "string",
          },
        },

        required: ["expression", "explanation"],
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
              "word_choice",
              "repetition",
              "collocation",
              "precision",
              "register",
              "word_form",
              "natural_expression",
              "other",
            ],
          },

          severity: {
            type: "string",
            enum: ["minor", "medium", "major"],
          },

          original: {
            type: "string",
          },

          suggestion: {
            type: "string",
          },

          explanation: {
            type: "string",
          },
        },

        required: ["category", "severity", "original", "suggestion", "explanation"],
      },
    },
  },

  required: ["score", "range", "isAppropriate", "summary", "suggestedText", "strengths", "issues"],
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
    throw new VocabularyEvaluationError({
      code: "invalid_text",
      retryable: false,
      message: "Vocabulary evaluation text cannot be empty.",
    });
  }

  if (normalized.length > MAX_VOCABULARY_TEXT_LENGTH) {
    throw new VocabularyEvaluationError({
      code: "invalid_text",
      retryable: false,
      message: "Vocabulary evaluation text is too long.",
    });
  }

  return normalized;
}

function extractOutputText(payload: OpenAiResponse): string {
  if (!Array.isArray(payload.output)) {
    throw new VocabularyEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The vocabulary evaluation service returned an invalid response.",
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
    throw new VocabularyEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The vocabulary evaluation service returned an empty response.",
    });
  }

  return text;
}

function mapOpenAiStatus(status: number): VocabularyEvaluationError {
  if (status === 401 || status === 403) {
    return new VocabularyEvaluationError({
      code: "authentication_failed",
      retryable: false,
      message: "The vocabulary evaluation service is not authorized.",
    });
  }

  if (status === 429) {
    return new VocabularyEvaluationError({
      code: "rate_limited",
      retryable: true,
      message: "The vocabulary evaluation service is busy. Please try again shortly.",
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new VocabularyEvaluationError({
      code: "provider_unavailable",
      retryable: true,
      message: "The vocabulary evaluation service is temporarily unavailable.",
    });
  }

  return new VocabularyEvaluationError({
    code: "evaluation_failed",
    retryable: false,
    message: "Vocabulary evaluation could not be completed.",
  });
}

export async function evaluateVocabularyWithOpenAi(
  request: VocabularyEvaluationRequest,
): Promise<VocabularyEvaluationResult> {
  const text = normalizeText(request.text);

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

        instructions: buildVocabularyEvaluationInstructions(),

        input: [
          {
            role: "user",

            content: [
              {
                type: "input_text",
                text,
              },
            ],
          },
        ],

        text: {
          format: {
            type: "json_schema",

            name: "vocabulary_evaluation",

            description: "Structured vocabulary feedback for an English learner speaking response.",

            strict: true,

            schema: vocabularyEvaluationJsonSchema,
          },
        },

        max_output_tokens: 1500,
      }),
    });
  } catch (error) {
    throw new VocabularyEvaluationError({
      code: "provider_unavailable",
      retryable: true,

      message: "The vocabulary evaluation service could not be reached.",

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
    throw new VocabularyEvaluationError({
      code: "invalid_response",
      retryable: true,

      message: "The vocabulary evaluation service returned invalid data.",

      cause: error,
    });
  }

  const outputText = extractOutputText(payload);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(outputText);
  } catch (error) {
    throw new VocabularyEvaluationError({
      code: "invalid_response",
      retryable: true,

      message: "The vocabulary evaluation service returned malformed structured data.",

      cause: error,
    });
  }

  const validated = vocabularyEvaluationSchema.safeParse(parsedJson);

  if (!validated.success) {
    throw new VocabularyEvaluationError({
      code: "invalid_response",
      retryable: true,

      message: "The vocabulary evaluation response did not match the expected format.",

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

import { getWritingEvaluationApiKey, getWritingEvaluationModel } from "../evaluation/config";
import { WritingEvaluationError } from "../evaluation/errors";

import {
  buildVocabularySuggestionInput,
  buildVocabularySuggestionSystemPrompt,
} from "./vocabulary-prompt";
import { validateVocabularySuggestionProviderResult } from "./vocabulary-schema";
import {
  vocabularySuggestionKinds,
  type VocabularySuggestionRequest,
  type VocabularySuggestionResult,
} from "./vocabulary-types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const REQUEST_TIMEOUT_MS = 60_000;

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

function createVocabularySuggestionJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,

    properties: {
      schemaVersion: {
        type: "integer",
        enum: [1],
      },

      originalText: {
        type: "string",
      },

      summary: {
        type: "string",
      },

      suggestions: {
        type: "array",

        items: {
          type: "object",
          additionalProperties: false,

          properties: {
            originalText: {
              type: "string",
            },

            suggestedText: {
              type: "string",
            },

            kind: {
              type: "string",
              enum: [...vocabularySuggestionKinds],
            },

            explanation: {
              type: "string",
            },

            example: {
              type: ["string", "null"],
            },
          },

          required: ["originalText", "suggestedText", "kind", "explanation", "example"],
        },
      },
    },

    required: ["schemaVersion", "originalText", "summary", "suggestions"],
  };
}

function invalidResponse(cause?: unknown): WritingEvaluationError {
  return new WritingEvaluationError({
    code: "invalid_provider_response",
    message: "The vocabulary suggestion service returned an invalid response.",
    retryable: true,
    cause,
  });
}

function extractResponseText(payload: OpenAiResponse): string {
  if (!Array.isArray(payload.output)) {
    throw invalidResponse();
  }

  const textParts: string[] = [];

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
        textParts.push(textItem.text);
      }
    }
  }

  const content = textParts.join("\n").trim();

  if (!content) {
    throw invalidResponse();
  }

  return content;
}

function mapOpenAiStatus(status: number): WritingEvaluationError {
  if (status === 401 || status === 403) {
    return new WritingEvaluationError({
      code: "provider_failed",
      message: "The vocabulary suggestion service is not authorized.",
      retryable: false,
    });
  }

  if (status === 429) {
    return new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The vocabulary suggestion service is busy. Please try again shortly.",
      retryable: true,
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The vocabulary suggestion service is temporarily unavailable.",
      retryable: true,
    });
  }

  return new WritingEvaluationError({
    code: "provider_failed",
    message: "The vocabulary suggestion service could not analyze this text.",
    retryable: false,
  });
}

export async function generateVocabularySuggestions(
  request: VocabularySuggestionRequest,
): Promise<VocabularySuggestionResult> {
  const apiKey = getWritingEvaluationApiKey();
  const model = getWritingEvaluationModel();

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

        instructions: buildVocabularySuggestionSystemPrompt(),

        input: buildVocabularySuggestionInput(request),

        max_output_tokens: 2_000,

        text: {
          format: {
            type: "json_schema",

            name: "writing_vocabulary_suggestions",

            description:
              "Structured educational vocabulary suggestions for learner-selected English text.",

            strict: true,

            schema: createVocabularySuggestionJsonSchema(),
          },
        },
      }),
    });
  } catch (error) {
    console.error("[writing-vocabulary-suggestions] OpenAI connection failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    throw new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The vocabulary suggestion service could not be reached.",
      retryable: true,
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error("[writing-vocabulary-suggestions] OpenAI request failed", {
      status: response.status,
      requestId: response.headers.get("x-request-id"),
    });

    throw mapOpenAiStatus(response.status);
  }

  let payload: OpenAiResponse;

  try {
    payload = (await response.json()) as OpenAiResponse;
  } catch (error) {
    throw invalidResponse(error);
  }

  const responseText = extractResponseText(payload);

  let rawResult: unknown;

  try {
    rawResult = JSON.parse(responseText);
  } catch (error) {
    throw invalidResponse(error);
  }

  const result = validateVocabularySuggestionProviderResult(rawResult);

  return {
    ...result,
    originalText: request.selectedText,
  };
}

import { getWritingEvaluationApiKey, getWritingEvaluationModel } from "../evaluation/config";
import { WritingEvaluationError } from "../evaluation/errors";

import {
  buildNativeExplanationInput,
  buildNativeExplanationSystemPrompt,
} from "./native-explanation-prompt";
import { validateNativeExplanationProviderResult } from "./native-explanation-schema";
import {
  writingNativeLanguages,
  type NativeExplanationRequest,
  type NativeExplanationResult,
} from "./native-explanation-types";

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

function createNativeExplanationJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,

    properties: {
      schemaVersion: {
        type: "integer",
        enum: [1],
      },

      targetLanguage: {
        type: "string",
        enum: [...writingNativeLanguages],
      },

      explanation: {
        type: "string",
      },
    },

    required: ["schemaVersion", "targetLanguage", "explanation"],
  };
}

function invalidResponse(cause?: unknown): WritingEvaluationError {
  return new WritingEvaluationError({
    code: "invalid_provider_response",
    message: "The native-language explanation service returned an invalid response.",
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
      message: "The native-language explanation service is not authorized.",
      retryable: false,
    });
  }

  if (status === 429) {
    return new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The native-language explanation service is busy. Please try again shortly.",
      retryable: true,
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The native-language explanation service is temporarily unavailable.",
      retryable: true,
    });
  }

  return new WritingEvaluationError({
    code: "provider_failed",
    message: "The native-language explanation service could not process this explanation.",
    retryable: false,
  });
}

export async function generateNativeExplanation(
  request: NativeExplanationRequest,
): Promise<NativeExplanationResult> {
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

        instructions: buildNativeExplanationSystemPrompt(),

        input: buildNativeExplanationInput(request),

        max_output_tokens: 1_500,

        text: {
          format: {
            type: "json_schema",

            name: "writing_native_language_explanation",

            description:
              "Structured native-language explanation of existing English-learning guidance.",

            strict: true,

            schema: createNativeExplanationJsonSchema(),
          },
        },
      }),
    });
  } catch (error) {
    console.error("[writing-native-explanation] OpenAI connection failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    throw new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The native-language explanation service could not be reached.",
      retryable: true,
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error("[writing-native-explanation] OpenAI request failed", {
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

  const result = validateNativeExplanationProviderResult(rawResult);

  return {
    ...result,
    targetLanguage: request.targetLanguage,
  };
}

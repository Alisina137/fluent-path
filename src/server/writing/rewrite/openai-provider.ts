import { getWritingEvaluationApiKey, getWritingEvaluationModel } from "../evaluation/config";
import { WritingEvaluationError } from "../evaluation/errors";

import { buildWritingRewriteInput, buildWritingRewriteSystemPrompt } from "./prompt";
import { validateWritingRewriteProviderResult } from "./schema";

import type { WritingRewriteProviderRequest, WritingRewriteSuggestion } from "./types";

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

export async function generateOpenAiWritingRewrite(
  request: WritingRewriteProviderRequest,
): Promise<WritingRewriteSuggestion> {
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

        instructions: buildWritingRewriteSystemPrompt(),

        input: buildWritingRewriteInput(request),

        max_output_tokens: 1_000,

        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });
  } catch (error) {
    throw new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The writing rewrite service could not be reached.",
      retryable: true,
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
    throw invalidResponse(error);
  }

  const responseText = extractResponseText(payload);

  let rawResult: unknown;

  try {
    rawResult = JSON.parse(responseText);
  } catch (error) {
    throw invalidResponse(error);
  }

  let validated;

  try {
    validated = validateWritingRewriteProviderResult(rawResult);
  } catch (error) {
    throw invalidResponse(error);
  }

  return {
    ...validated,
    provider: "openai",
    model,
    providerRequestId: response.headers.get("x-request-id"),
  };
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

function invalidResponse(cause?: unknown): WritingEvaluationError {
  return new WritingEvaluationError({
    code: "invalid_provider_response",
    message: "The writing rewrite service returned an invalid response.",
    retryable: true,
    cause,
  });
}

function mapOpenAiStatus(status: number): WritingEvaluationError {
  if (status === 401 || status === 403) {
    return new WritingEvaluationError({
      code: "provider_failed",
      message: "The writing rewrite service is not authorized.",
      retryable: false,
    });
  }

  if (status === 429) {
    return new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The writing rewrite service is busy. Please try again shortly.",
      retryable: true,
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The writing rewrite service is temporarily unavailable.",
      retryable: true,
    });
  }

  return new WritingEvaluationError({
    code: "provider_failed",
    message: "The writing rewrite service could not create a suggestion.",
    retryable: false,
  });
}

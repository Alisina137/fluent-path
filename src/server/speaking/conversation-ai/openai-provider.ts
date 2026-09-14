import { getConversationAiApiKey, getConversationAiModel } from "./config";
import type { ConversationAiProvider } from "./provider";
import {
  ConversationAiError,
  type ConversationAiRequest,
  type ConversationAiResult,
} from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const REQUEST_TIMEOUT_MS = 45_000;

type OpenAiOutputText = {
  type?: unknown;
  text?: unknown;
};

type OpenAiOutputItem = {
  type?: unknown;
  role?: unknown;
  content?: unknown;
};

type OpenAiResponse = {
  id?: unknown;
  output?: unknown;
};

function extractResponseText(payload: OpenAiResponse): string {
  if (!Array.isArray(payload.output)) {
    throw new ConversationAiError({
      code: "invalid_response",
      provider: "openai",
      retryable: true,
      message: "The AI conversation service returned an invalid response.",
    });
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
    throw new ConversationAiError({
      code: "invalid_response",
      provider: "openai",
      retryable: true,
      message: "The AI conversation service returned an empty response.",
    });
  }

  return content;
}

function mapOpenAiStatus(status: number): ConversationAiError {
  if (status === 401 || status === 403) {
    return new ConversationAiError({
      code: "authentication_failed",
      provider: "openai",
      retryable: false,
      message: "The AI conversation service is not authorized.",
    });
  }

  if (status === 429) {
    return new ConversationAiError({
      code: "rate_limited",
      provider: "openai",
      retryable: true,
      message: "The AI conversation service is busy. Please try again shortly.",
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new ConversationAiError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message: "The AI conversation service is temporarily unavailable.",
    });
  }

  return new ConversationAiError({
    code: "generation_failed",
    provider: "openai",
    retryable: false,
    message: "The AI Coach could not generate a response.",
  });
}

async function generateWithOpenAi(request: ConversationAiRequest): Promise<ConversationAiResult> {
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
        instructions: request.systemPrompt,
        input: request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        max_output_tokens: 300,
      }),
    });
  } catch (error) {
    throw new ConversationAiError({
      code: "provider_unavailable",
      provider: "openai",
      retryable: true,
      message: "The AI conversation service could not be reached.",
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
    throw new ConversationAiError({
      code: "invalid_response",
      provider: "openai",
      retryable: true,
      message: "The AI conversation service returned an invalid response.",
      cause: error,
    });
  }

  return {
    content: extractResponseText(payload),
    provider: "openai",
    model,
    providerRequestId: response.headers.get("x-request-id"),
  };
}

export const openAiConversationProvider: ConversationAiProvider = {
  id: "openai",
  generate: generateWithOpenAi,
};

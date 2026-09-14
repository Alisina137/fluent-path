import {
  getConversationAiApiKey,
  getConversationAiModel,
} from "@/server/speaking/conversation-ai/config";
import { logServerError } from "@/lib/observability/server-logger";

import { buildGrammarEvaluationInstructions } from "./prompt";
import { grammarEvaluationSchema } from "./schema";
import {
  GrammarEvaluationError,
  type GrammarEvaluationRequest,
  type GrammarEvaluationResult,
} from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const REQUEST_TIMEOUT_MS = 45_000;

const MAX_GRAMMAR_TEXT_LENGTH = 10_000;

const grammarEvaluationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isCorrect: {
      type: "boolean",
    },
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
    correctedText: {
      type: "string",
    },
    summary: {
      type: "string",
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
              "verb_tense",
              "subject_verb_agreement",
              "articles",
              "prepositions",
              "pronouns",
              "pluralization",
              "word_order",
              "sentence_structure",
              "auxiliary_verbs",
              "conditionals",
              "comparatives",
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
          correction: {
            type: "string",
          },
          explanation: {
            type: "string",
          },
        },
        required: ["category", "severity", "original", "correction", "explanation"],
      },
    },
  },
  required: ["isCorrect", "score", "correctedText", "summary", "issues"],
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
    throw new GrammarEvaluationError({
      code: "invalid_text",
      retryable: false,
      message: "Grammar evaluation text cannot be empty.",
    });
  }

  if (normalized.length > MAX_GRAMMAR_TEXT_LENGTH) {
    throw new GrammarEvaluationError({
      code: "invalid_text",
      retryable: false,
      message: "Grammar evaluation text is too long.",
    });
  }

  return normalized;
}

function extractOutputText(payload: OpenAiResponse): string {
  if (!Array.isArray(payload.output)) {
    throw new GrammarEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The grammar evaluation service returned an invalid response.",
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

    for (const content of outputItem.content) {
      if (!content || typeof content !== "object") {
        continue;
      }

      const textItem = content as OpenAiOutputText;

      if (textItem.type === "output_text" && typeof textItem.text === "string") {
        parts.push(textItem.text);
      }
    }
  }

  const text = parts.join("\n").trim();

  if (!text) {
    throw new GrammarEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The grammar evaluation service returned an empty response.",
    });
  }

  return text;
}

function mapOpenAiStatus(status: number): GrammarEvaluationError {
  if (status === 401 || status === 403) {
    return new GrammarEvaluationError({
      code: "authentication_failed",
      retryable: false,
      message: "The grammar evaluation service is not authorized.",
    });
  }

  if (status === 429) {
    return new GrammarEvaluationError({
      code: "rate_limited",
      retryable: true,
      message: "The grammar evaluation service is busy. Please try again shortly.",
    });
  }

  if (status === 408 || status === 409 || status >= 500) {
    return new GrammarEvaluationError({
      code: "provider_unavailable",
      retryable: true,
      message: "The grammar evaluation service is temporarily unavailable.",
    });
  }

  return new GrammarEvaluationError({
    code: "evaluation_failed",
    retryable: false,
    message: "Grammar evaluation could not be completed.",
  });
}

export async function evaluateGrammarWithOpenAi(
  request: GrammarEvaluationRequest,
): Promise<GrammarEvaluationResult> {
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
        instructions: buildGrammarEvaluationInstructions(),
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
            name: "grammar_evaluation",
            description: "Structured grammar feedback for an English learner speaking response.",
            strict: true,
            schema: grammarEvaluationJsonSchema,
          },
        },
        max_output_tokens: 1200,
      }),
    });
  } catch (error) {
    throw new GrammarEvaluationError({
      code: "provider_unavailable",
      retryable: true,
      message: "The grammar evaluation service could not be reached.",
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    logServerError({
      subsystem: "speaking_grammar_feedback",
      operation: "openai_request",
      code: `http_${response.status}`,
    });

    throw mapOpenAiStatus(response.status);
  }

  let payload: OpenAiResponse;

  try {
    payload = (await response.json()) as OpenAiResponse;
  } catch (error) {
    throw new GrammarEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The grammar evaluation service returned invalid data.",
      cause: error,
    });
  }

  const outputText = extractOutputText(payload);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(outputText);
  } catch (error) {
    throw new GrammarEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The grammar evaluation service returned malformed structured data.",
      cause: error,
    });
  }

  const validated = grammarEvaluationSchema.safeParse(parsedJson);

  if (!validated.success) {
    throw new GrammarEvaluationError({
      code: "invalid_response",
      retryable: true,
      message: "The grammar evaluation response did not match the expected format.",
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

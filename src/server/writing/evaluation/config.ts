import { WritingEvaluationError } from "./errors";

const DEFAULT_PROVIDER = "openai";

const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";

export function getWritingEvaluationProviderId(): string {
  const configured = process.env.WRITING_EVALUATION_PROVIDER?.trim().toLowerCase();

  if (!configured) {
    return DEFAULT_PROVIDER;
  }

  if (configured !== "openai") {
    throw new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The configured writing evaluation provider is unsupported.",
      retryable: false,
    });
  }

  return configured;
}

export function getWritingEvaluationModel(): string {
  return process.env.OPENAI_WRITING_EVALUATION_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getWritingEvaluationApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new WritingEvaluationError({
      code: "provider_unavailable",
      message: "The writing evaluation service is not configured.",
      retryable: false,
    });
  }

  return apiKey;
}

import type { SpeakingScenarioDefinition } from "../types";

export type CustomSpeakingScenarioRequest = {
  description: string;
};

export type GeneratedCustomSpeakingScenario = {
  scenario: SpeakingScenarioDefinition;
  provider: "openai";
  model: string;
  providerRequestId: string | null;
};

export type CustomSpeakingScenarioErrorCode =
  | "invalid_request"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "generation_failed"
  | "invalid_response";

export class CustomSpeakingScenarioError extends Error {
  readonly code: CustomSpeakingScenarioErrorCode;

  readonly retryable: boolean;

  constructor(options: {
    code: CustomSpeakingScenarioErrorCode;
    message: string;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "CustomSpeakingScenarioError";

    this.code = options.code;

    this.retryable = options.retryable ?? false;
  }
}

export type ConversationAiProviderId = "openai";

export type ConversationAiRole = "user" | "assistant";

export type ConversationAiMessage = {
  role: ConversationAiRole;
  content: string;
};

export type ConversationAiRequest = {
  messages: ConversationAiMessage[];
  systemPrompt: string;
};

export type ConversationAiResult = {
  content: string;
  provider: ConversationAiProviderId;
  model: string;
  providerRequestId: string | null;
};

export type ConversationAiErrorCode =
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "invalid_response"
  | "generation_failed";

export class ConversationAiError extends Error {
  readonly code: ConversationAiErrorCode;
  readonly provider: ConversationAiProviderId | null;
  readonly retryable: boolean;

  constructor(options: {
    code: ConversationAiErrorCode;
    message: string;
    provider?: ConversationAiProviderId | null;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "ConversationAiError";
    this.code = options.code;
    this.provider = options.provider ?? null;
    this.retryable = options.retryable ?? false;
  }
}

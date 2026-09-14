export type TextToSpeechProviderId = "openai";

export type TextToSpeechAudioFormat = "mp3";

export type TextToSpeechRequest = {
  text: string;
  voice?: string;
};

export type TextToSpeechResult = {
  audio: Uint8Array;
  contentType: string;
  format: TextToSpeechAudioFormat;
  provider: TextToSpeechProviderId;
  model: string;
  voice: string;
  providerRequestId: string | null;
};

export type TextToSpeechErrorCode =
  | "invalid_text"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "generation_failed"
  | "invalid_response";

type TextToSpeechErrorOptions = {
  code: TextToSpeechErrorCode;
  message: string;
  provider?: TextToSpeechProviderId;
  retryable?: boolean;
  cause?: unknown;
};

export class TextToSpeechError extends Error {
  readonly code: TextToSpeechErrorCode;

  readonly provider?: TextToSpeechProviderId;

  readonly retryable: boolean;

  constructor(options: TextToSpeechErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "TextToSpeechError";

    this.code = options.code;

    this.provider = options.provider;

    this.retryable = options.retryable ?? false;
  }
}

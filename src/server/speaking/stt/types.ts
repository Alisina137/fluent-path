export type SpeechToTextProviderId = "openai";

export type SpeechToTextAudioInput = {
  data: Uint8Array;
  mimeType: string;
  fileName: string;
  durationMs?: number;
};

export type SpeechToTextRequest = {
  audio: SpeechToTextAudioInput;
  language?: string;
};

export type SpeechToTextResult = {
  transcript: string;
  language: string | null;
  durationMs: number | null;
  provider: SpeechToTextProviderId;
  providerRequestId: string | null;
};

export type SpeechToTextErrorCode =
  | "invalid_audio"
  | "unsupported_audio"
  | "provider_unavailable"
  | "rate_limited"
  | "authentication_failed"
  | "transcription_failed"
  | "configuration_error";

export class SpeechToTextError extends Error {
  readonly code: SpeechToTextErrorCode;
  readonly provider: SpeechToTextProviderId | null;
  readonly retryable: boolean;

  constructor(options: {
    code: SpeechToTextErrorCode;
    message: string;
    provider?: SpeechToTextProviderId | null;
    retryable?: boolean;
    cause?: unknown;
  }) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "SpeechToTextError";
    this.code = options.code;
    this.provider = options.provider ?? null;
    this.retryable = options.retryable ?? false;
  }
}

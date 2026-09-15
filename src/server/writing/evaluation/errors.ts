export type WritingEvaluationErrorCode =
  | "revision_not_found"
  | "revision_empty"
  | "evaluation_unavailable"
  | "provider_unavailable"
  | "provider_failed"
  | "invalid_provider_response";

export interface WritingEvaluationErrorOptions {
  code: WritingEvaluationErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
}

export class WritingEvaluationError extends Error {
  readonly code: WritingEvaluationErrorCode;
  readonly retryable: boolean;

  constructor(options: WritingEvaluationErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "WritingEvaluationError";
    this.code = options.code;
    this.retryable = options.retryable ?? false;
  }
}

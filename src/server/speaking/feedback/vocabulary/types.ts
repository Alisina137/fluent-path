export type VocabularyIssueCategory =
  | "word_choice"
  | "repetition"
  | "collocation"
  | "precision"
  | "register"
  | "word_form"
  | "natural_expression"
  | "other";

export type VocabularyIssueSeverity = "minor" | "medium" | "major";

export type VocabularyIssue = {
  category: VocabularyIssueCategory;
  severity: VocabularyIssueSeverity;
  original: string;
  suggestion: string;
  explanation: string;
};

export type VocabularyStrength = {
  expression: string;
  explanation: string;
};

export type VocabularyEvaluation = {
  score: number;
  range: "basic" | "developing" | "good" | "strong";
  isAppropriate: boolean;
  summary: string;
  suggestedText: string;
  strengths: VocabularyStrength[];
  issues: VocabularyIssue[];
};

export type VocabularyEvaluationRequest = {
  text: string;
};

export type VocabularyEvaluationResult = {
  evaluation: VocabularyEvaluation;
  provider: "openai";
  model: string;
  providerRequestId: string | null;
};

export type VocabularyEvaluationErrorCode =
  | "invalid_text"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "evaluation_failed"
  | "invalid_response";

type VocabularyEvaluationErrorOptions = {
  code: VocabularyEvaluationErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
};

export class VocabularyEvaluationError extends Error {
  readonly code: VocabularyEvaluationErrorCode;

  readonly retryable: boolean;

  constructor(options: VocabularyEvaluationErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "VocabularyEvaluationError";

    this.code = options.code;

    this.retryable = options.retryable ?? false;
  }
}

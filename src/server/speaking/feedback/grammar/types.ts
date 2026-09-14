export type GrammarIssueCategory =
  | "verb_tense"
  | "subject_verb_agreement"
  | "articles"
  | "prepositions"
  | "pronouns"
  | "pluralization"
  | "word_order"
  | "sentence_structure"
  | "auxiliary_verbs"
  | "conditionals"
  | "comparatives"
  | "other";

export type GrammarIssueSeverity = "minor" | "medium" | "major";

export type GrammarIssue = {
  category: GrammarIssueCategory;
  severity: GrammarIssueSeverity;
  original: string;
  correction: string;
  explanation: string;
};

export type GrammarEvaluation = {
  isCorrect: boolean;
  score: number;
  correctedText: string;
  summary: string;
  issues: GrammarIssue[];
};

export type GrammarEvaluationRequest = {
  text: string;
};

export type GrammarEvaluationResult = {
  evaluation: GrammarEvaluation;
  provider: "openai";
  model: string;
  providerRequestId: string | null;
};

export type GrammarEvaluationErrorCode =
  | "invalid_text"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "evaluation_failed"
  | "invalid_response";

type GrammarEvaluationErrorOptions = {
  code: GrammarEvaluationErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
};

export class GrammarEvaluationError extends Error {
  readonly code: GrammarEvaluationErrorCode;

  readonly retryable: boolean;

  constructor(options: GrammarEvaluationErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "GrammarEvaluationError";

    this.code = options.code;

    this.retryable = options.retryable ?? false;
  }
}

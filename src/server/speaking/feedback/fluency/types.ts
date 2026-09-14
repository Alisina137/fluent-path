export type FluencyMeasurementBasis = "transcript_only";

export type FluencyLevel = "limited" | "developing" | "functional" | "smooth";

export type FluencyIssueCategory =
  "fragmentation" | "repetition" | "filler_usage" | "discourse_flow" | "idea_development" | "other";

export type FluencyIssueSeverity = "minor" | "medium" | "major";

export type FluencyIssue = {
  category: FluencyIssueCategory;
  severity: FluencyIssueSeverity;
  evidence: string;
  suggestion: string;
  explanation: string;
};

export type FluencyStrength = {
  evidence: string;
  explanation: string;
};

export type FluencyTranscriptMetrics = {
  wordCount: number;
  uniqueWordCount: number;
  lexicalRepetitionRatio: number;
  visibleFillerCount: number;
};

export type FluencyEvaluation = {
  measurementBasis: FluencyMeasurementBasis;
  score: number;
  level: FluencyLevel;
  summary: string;
  improvementTip: string;
  strengths: FluencyStrength[];
  issues: FluencyIssue[];
  metrics: FluencyTranscriptMetrics;
};

export type FluencyAiEvaluation = {
  score: number;
  level: FluencyLevel;
  summary: string;
  improvementTip: string;
  strengths: FluencyStrength[];
  issues: FluencyIssue[];
};

export type FluencyEvaluationRequest = {
  text: string;
};

export type FluencyEvaluationResult = {
  evaluation: FluencyEvaluation;
  provider: "openai";
  model: string;
  providerRequestId: string | null;
};

export type FluencyEvaluationErrorCode =
  | "invalid_text"
  | "configuration_error"
  | "authentication_failed"
  | "rate_limited"
  | "provider_unavailable"
  | "evaluation_failed"
  | "invalid_response";

type FluencyEvaluationErrorOptions = {
  code: FluencyEvaluationErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
};

export class FluencyEvaluationError extends Error {
  readonly code: FluencyEvaluationErrorCode;

  readonly retryable: boolean;

  constructor(options: FluencyEvaluationErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "FluencyEvaluationError";

    this.code = options.code;

    this.retryable = options.retryable ?? false;
  }
}

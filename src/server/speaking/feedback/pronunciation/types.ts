export type PronunciationAssessmentStatus = "available" | "unavailable";

export type PronunciationMeasurementBasis = "audio";

export type PronunciationProviderId = "none";

export type PronunciationAudioInput = {
  data: Uint8Array;
  mimeType: string;
  fileName: string;
  durationMs?: number;
};

export type PronunciationAssessmentRequest = {
  audio: PronunciationAudioInput;
  transcript?: string;
  language?: string;
};

export type PronunciationIssue = {
  word: string;
  issue: string;
  suggestion: string;
};

export type PronunciationAssessment = {
  status: PronunciationAssessmentStatus;
  measurementBasis: PronunciationMeasurementBasis;
  score: number | null;
  summary: string;
  issues: PronunciationIssue[];
};

export type PronunciationAssessmentResult = {
  assessment: PronunciationAssessment;
  provider: PronunciationProviderId;
  providerRequestId: string | null;
};

export type PronunciationAssessmentErrorCode =
  "invalid_audio" | "unsupported_audio" | "provider_unavailable" | "assessment_failed";

type PronunciationAssessmentErrorOptions = {
  code: PronunciationAssessmentErrorCode;
  message: string;
  retryable?: boolean;
  cause?: unknown;
};

export class PronunciationAssessmentError extends Error {
  readonly code: PronunciationAssessmentErrorCode;

  readonly retryable: boolean;

  constructor(options: PronunciationAssessmentErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "PronunciationAssessmentError";

    this.code = options.code;

    this.retryable = options.retryable ?? false;
  }
}

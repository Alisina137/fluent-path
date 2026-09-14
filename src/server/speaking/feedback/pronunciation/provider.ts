import type {
  PronunciationAssessmentRequest,
  PronunciationAssessmentResult,
  PronunciationProviderId,
} from "./types";

export interface PronunciationAssessmentProvider {
  readonly id: PronunciationProviderId;

  isAvailable(): boolean;

  assess(request: PronunciationAssessmentRequest): Promise<PronunciationAssessmentResult>;
}

import { getPronunciationAssessmentProvider } from "./provider-registry";

import {
  PronunciationAssessmentError,
  type PronunciationAssessmentRequest,
  type PronunciationAssessmentResult,
} from "./types";

export async function assessSpeakingPronunciation(
  request: PronunciationAssessmentRequest,
): Promise<PronunciationAssessmentResult> {
  if (request.audio.data.byteLength === 0) {
    throw new PronunciationAssessmentError({
      code: "invalid_audio",
      message: "Pronunciation audio is empty.",
    });
  }

  if (!request.audio.mimeType.trim()) {
    throw new PronunciationAssessmentError({
      code: "invalid_audio",
      message: "Pronunciation audio MIME type is required.",
    });
  }

  if (!request.audio.fileName.trim()) {
    throw new PronunciationAssessmentError({
      code: "invalid_audio",
      message: "Pronunciation audio file name is required.",
    });
  }

  const provider = getPronunciationAssessmentProvider();

  return provider.assess(request);
}

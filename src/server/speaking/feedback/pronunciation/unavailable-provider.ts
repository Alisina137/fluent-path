import type { PronunciationAssessmentProvider } from "./provider";

import type { PronunciationAssessmentRequest, PronunciationAssessmentResult } from "./types";

export const unavailablePronunciationProvider: PronunciationAssessmentProvider = {
  id: "none",

  isAvailable() {
    return false;
  },

  async assess(_request: PronunciationAssessmentRequest): Promise<PronunciationAssessmentResult> {
    return {
      assessment: {
        status: "unavailable",
        measurementBasis: "audio",
        score: null,
        summary: "Pronunciation assessment is not available with the current speech provider.",
        issues: [],
      },

      provider: "none",

      providerRequestId: null,
    };
  },
};

import { getPronunciationAssessmentProvider } from "./provider-registry";

export type PronunciationCapabilities = {
  available: boolean;
  requiresAudio: true;
  transcriptOnlySupported: false;
  phonemeScoring: false;
  wordScoring: false;
};

export function getPronunciationCapabilities(): PronunciationCapabilities {
  const provider = getPronunciationAssessmentProvider();

  return {
    available: provider.isAvailable(),

    requiresAudio: true,

    transcriptOnlySupported: false,

    phonemeScoring: false,

    wordScoring: false,
  };
}

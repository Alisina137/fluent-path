import { unavailablePronunciationProvider } from "./unavailable-provider";

import type { PronunciationAssessmentProvider } from "./provider";

let activeProvider: PronunciationAssessmentProvider = unavailablePronunciationProvider;

export function getPronunciationAssessmentProvider(): PronunciationAssessmentProvider {
  return activeProvider;
}

export function registerPronunciationAssessmentProvider(
  provider: PronunciationAssessmentProvider,
): void {
  activeProvider = provider;
}

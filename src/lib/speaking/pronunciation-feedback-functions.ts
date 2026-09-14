import { createServerFn } from "@tanstack/react-start";

export type PronunciationCapabilityResult = {
  available: boolean;
  requiresAudio: true;
  transcriptOnlySupported: false;
  phonemeScoring: false;
  wordScoring: false;
};

export const getSpeakingPronunciationCapabilitiesServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<PronunciationCapabilityResult> => {
  const { getPronunciationCapabilities } =
    await import("@/server/speaking/feedback/pronunciation/capabilities");

  return getPronunciationCapabilities();
});

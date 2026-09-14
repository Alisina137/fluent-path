import { calculateFluencyTranscriptMetrics } from "./metrics";

import { evaluateFluencyWithOpenAi } from "./openai";

import type { FluencyEvaluationResult } from "./types";

export async function evaluateSpeakingFluency(text: string): Promise<FluencyEvaluationResult> {
  const metrics = calculateFluencyTranscriptMetrics(text);

  const aiResult = await evaluateFluencyWithOpenAi(text);

  return {
    evaluation: {
      measurementBasis: "transcript_only",

      ...aiResult.evaluation,

      metrics,
    },

    provider: aiResult.provider,

    model: aiResult.model,

    providerRequestId: aiResult.providerRequestId,
  };
}

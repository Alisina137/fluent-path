import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createOrReuseWritingRevision } from "@/server/writing/revisions";

import { evaluateWritingRevision } from "@/server/writing/evaluation/service";

import { validateWritingProviderEvaluation } from "@/server/writing/evaluation/schema";

import { buildOverallWritingFeedback } from "@/server/writing/feedback/overall-feedback";

import { normalizeWritingFeedback } from "@/server/writing/feedback/normalize";

import { buildSentenceFeedback } from "@/server/writing/feedback/sentence-feedback";

import { buildWritingFeedbackExplanations } from "@/server/writing/feedback/explanations";

import type { WritingEvaluationResult } from "@/server/writing/evaluation/types";

const requestWritingFeedbackInputSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().uuid(),
});

export const requestWritingFeedbackServerFn = createServerFn({ method: "POST" })
  .validator(requestWritingFeedbackInputSchema)
  .handler(async ({ data }) => {
    const revisionResult = await createOrReuseWritingRevision(data.userId, data.sessionId);

    const revision = revisionResult.revision;

    const storedOrResult = await evaluateWritingRevision(data.userId, revision.id);
    const evaluation = normalizeEvaluationResult(storedOrResult, revision.content);

    const feedback = normalizeWritingFeedback(evaluation);

    return {
      revision: {
        id: revision.id,
        revisionNumber: revision.revisionNumber,
        content: revision.content,
        wordCount: revision.wordCount,
        characterCount: revision.characterCount,
        created: revisionResult.created,
      },

      evaluation,

      feedback,

      overall: buildOverallWritingFeedback(evaluation, feedback),

      sentenceFeedback: buildSentenceFeedback(revision.content, feedback),

      explanations: buildWritingFeedbackExplanations(feedback.items),
    };
  });

function normalizeEvaluationResult(
  value: Awaited<ReturnType<typeof evaluateWritingRevision>>,
  learnerText: string,
): WritingEvaluationResult {
  if ("evaluation" in value) {
    const providerEvaluation = validateWritingProviderEvaluation(value.evaluation, learnerText);

    return {
      ...providerEvaluation,

      overallScore: value.overallScore,

      provider: value.provider,

      model: value.model,

      providerRequestId: value.providerRequestId,
    };
  }

  return value;
}

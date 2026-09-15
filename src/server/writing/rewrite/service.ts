import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingEvaluations, writingRevisions, writingSessions } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";
import { normalizeWritingFeedback } from "@/server/writing/feedback/normalize";

import { validateWritingProviderEvaluation } from "../evaluation/schema";
import { WritingEvaluationError } from "../evaluation/errors";
import { generateOpenAiWritingRewrite } from "./openai-provider";

import type { WritingEvaluationResult } from "../evaluation/types";
import type { WritingRewriteRequest, WritingRewriteSuggestion } from "./types";

export async function generateWritingRewriteSuggestion(
  userId: string,
  request: WritingRewriteRequest,
): Promise<WritingRewriteSuggestion> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const [result] = await db
    .select({
      revision: writingRevisions,
      session: writingSessions,
      evaluation: writingEvaluations,
    })
    .from(writingRevisions)
    .innerJoin(writingSessions, eq(writingRevisions.sessionId, writingSessions.id))
    .innerJoin(writingEvaluations, eq(writingEvaluations.revisionId, writingRevisions.id))
    .where(
      and(
        eq(writingRevisions.id, request.revisionId),
        eq(writingSessions.userId, userId),
        eq(writingSessions.moduleId, MODULE_IDS.writing),
      ),
    )
    .limit(1);

  if (!result) {
    throw new WritingEvaluationError({
      code: "revision_not_found",
      message: "The evaluated writing revision could not be found.",
    });
  }

  const providerEvaluation = validateWritingProviderEvaluation(
    result.evaluation.evaluation,
    result.revision.content,
  );

  const normalizedEvaluation: WritingEvaluationResult = {
    ...providerEvaluation,
    overallScore: result.evaluation.overallScore,
    provider: result.evaluation.provider,
    model: result.evaluation.model,
    providerRequestId: result.evaluation.providerRequestId,
  };

  const feedback = normalizeWritingFeedback(normalizedEvaluation);

  const authoritativeFeedback = feedback.items.find((item) => item.id === request.feedbackId);

  if (!authoritativeFeedback) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The selected writing feedback could not be found.",
      retryable: false,
    });
  }

  if (authoritativeFeedback.kind !== "text") {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "Rewrite suggestions require feedback linked to specific learner text.",
      retryable: false,
    });
  }

  return generateOpenAiWritingRewrite({
    originalText: authoritativeFeedback.originalText,

    category: authoritativeFeedback.category,

    dimension: authoritativeFeedback.dimension,

    feedbackMessage: authoritativeFeedback.message,

    feedbackExplanation: authoritativeFeedback.explanation,

    existingSuggestion: authoritativeFeedback.suggestedText,

    targetCefrLevel: result.session.taskSnapshot.cefrLevel,
  });
}

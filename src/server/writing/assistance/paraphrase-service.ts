import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { WritingEvaluationError } from "../evaluation/errors";

import { generateParaphrases } from "./paraphrase-provider";

import type { ParaphraseRequest, ParaphraseResult } from "./paraphrase-types";

const MAX_PARAPHRASE_CHARACTERS = 5_000;

export async function requestParaphrases(
  userId: string,
  request: ParaphraseRequest,
): Promise<ParaphraseResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const selectedText = request.selectedText.trim();

  if (!selectedText) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "Select some writing before requesting paraphrasing assistance.",
      retryable: false,
    });
  }

  if (selectedText.length > MAX_PARAPHRASE_CHARACTERS) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The selected text is too long for paraphrasing assistance.",
      retryable: false,
    });
  }

  return generateParaphrases({
    selectedText,
    targetCefrLevel: request.targetCefrLevel,
    goal: request.goal,
  });
}

import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { WritingEvaluationError } from "../evaluation/errors";

import { generateVocabularySuggestions } from "./vocabulary-provider";

import type { VocabularySuggestionRequest, VocabularySuggestionResult } from "./vocabulary-types";

const MAX_VOCABULARY_CHARACTERS = 5_000;

export async function requestVocabularySuggestions(
  userId: string,
  request: VocabularySuggestionRequest,
): Promise<VocabularySuggestionResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const selectedText = request.selectedText.trim();

  if (!selectedText) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "Select some writing before requesting vocabulary suggestions.",
      retryable: false,
    });
  }

  if (selectedText.length > MAX_VOCABULARY_CHARACTERS) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The selected text is too long for vocabulary suggestions.",
      retryable: false,
    });
  }

  return generateVocabularySuggestions({
    selectedText,
    targetCefrLevel: request.targetCefrLevel,
  });
}

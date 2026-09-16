import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { WritingEvaluationError } from "../evaluation/errors";

import { generateGrammarHelp } from "./grammar-provider";

import type { GrammarHelpRequest, GrammarHelpResult } from "./types";

const MAX_GRAMMAR_HELP_CHARACTERS = 5_000;

export async function requestGrammarHelp(
  userId: string,
  request: GrammarHelpRequest,
): Promise<GrammarHelpResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const selectedText = request.selectedText.trim();

  if (!selectedText) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "Select some writing before requesting grammar help.",
      retryable: false,
    });
  }

  if (selectedText.length > MAX_GRAMMAR_HELP_CHARACTERS) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The selected text is too long for grammar help.",
      retryable: false,
    });
  }

  return generateGrammarHelp({
    selectedText,
    targetCefrLevel: request.targetCefrLevel,
  });
}

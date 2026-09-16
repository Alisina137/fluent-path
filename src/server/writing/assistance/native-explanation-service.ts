import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { WritingEvaluationError } from "../evaluation/errors";

import { generateNativeExplanation } from "./native-explanation-provider";

import type { NativeExplanationRequest, NativeExplanationResult } from "./native-explanation-types";

const MAX_EXPLANATION_CHARACTERS = 5_000;

export async function requestNativeExplanation(
  userId: string,
  request: NativeExplanationRequest,
): Promise<NativeExplanationResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const englishExplanation = request.englishExplanation.trim();

  if (!englishExplanation) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "There is no explanation to translate.",
      retryable: false,
    });
  }

  if (englishExplanation.length > MAX_EXPLANATION_CHARACTERS) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The explanation is too long for native-language assistance.",
      retryable: false,
    });
  }

  if (request.targetLanguage === "English") {
    return {
      schemaVersion: 1,
      targetLanguage: "English",
      explanation: englishExplanation,
    };
  }

  return generateNativeExplanation({
    englishExplanation,
    targetLanguage: request.targetLanguage,
    targetCefrLevel: request.targetCefrLevel,
    context: request.context,
  });
}

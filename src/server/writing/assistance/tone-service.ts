import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

import { WritingEvaluationError } from "../evaluation/errors";

import { generateToneGuidance } from "./tone-provider";

import type { ToneGuidanceRequest, ToneGuidanceResult } from "./tone-types";

const MAX_TONE_GUIDANCE_CHARACTERS = 5_000;

export async function requestToneGuidance(
  userId: string,
  request: ToneGuidanceRequest,
): Promise<ToneGuidanceResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const selectedText = request.selectedText.trim();

  if (!selectedText) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "Select some writing before requesting tone guidance.",
      retryable: false,
    });
  }

  if (selectedText.length > MAX_TONE_GUIDANCE_CHARACTERS) {
    throw new WritingEvaluationError({
      code: "invalid_provider_response",
      message: "The selected text is too long for tone guidance.",
      retryable: false,
    });
  }

  return generateToneGuidance({
    selectedText,
    targetCefrLevel: request.targetCefrLevel,
    targetTone: request.targetTone,
  });
}

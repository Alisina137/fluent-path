import type { SpeakingFeedbackSkill } from "@/db/schema";

import {
  clearInFlightFeedbackRequest,
  createInFlightFeedbackKey,
  getInFlightFeedbackRequest,
  setInFlightFeedbackRequest,
} from "./in-flight";

type EvaluateSpeakingFeedbackOnceInput<T> = {
  userId: string;
  sessionId: string;
  messageId: string;
  skill: SpeakingFeedbackSkill;
  evaluate: () => Promise<T>;
};

export async function evaluateSpeakingFeedbackOnce<T>(
  input: EvaluateSpeakingFeedbackOnceInput<T>,
): Promise<T> {
  const key = createInFlightFeedbackKey({
    userId: input.userId,
    sessionId: input.sessionId,
    messageId: input.messageId,
    skill: input.skill,
  });

  const existing = getInFlightFeedbackRequest<T>(key);

  if (existing) {
    return existing;
  }

  const request = input.evaluate().finally(() => {
    clearInFlightFeedbackRequest(key);
  });

  setInFlightFeedbackRequest(key, request);

  return request;
}

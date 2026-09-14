import type { SpeakingFeedbackSkill } from "@/db/schema";

type InFlightFeedbackKeyInput = {
  userId: string;
  sessionId: string;
  messageId: string;
  skill: SpeakingFeedbackSkill;
};

const inFlightFeedbackRequests = new Map<string, Promise<unknown>>();

export function createInFlightFeedbackKey(input: InFlightFeedbackKeyInput): string {
  return [input.userId, input.sessionId, input.messageId, input.skill].join(":");
}

export function getInFlightFeedbackRequest<T>(key: string): Promise<T> | undefined {
  return inFlightFeedbackRequests.get(key) as Promise<T> | undefined;
}

export function setInFlightFeedbackRequest<T>(key: string, request: Promise<T>): void {
  inFlightFeedbackRequests.set(key, request);
}

export function clearInFlightFeedbackRequest(key: string): void {
  inFlightFeedbackRequests.delete(key);
}

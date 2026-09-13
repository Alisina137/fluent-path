import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  abandonSpeakingSession,
  completeSpeakingSession,
  getActiveSpeakingSession,
  getSpeakingSession,
  startSpeakingSession,
  touchSpeakingSession,
} from "@/server/speaking/sessions";

const userInputSchema = z.object({
  userId: z.string().uuid(),
});

const sessionInputSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export const startSpeakingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(userInputSchema)
  .handler(async ({ data }) => {
    return startSpeakingSession(data.userId);
  });

export const getActiveSpeakingSessionServerFn = createServerFn({
  method: "GET",
})
  .validator(userInputSchema)
  .handler(async ({ data }) => {
    return getActiveSpeakingSession(data.userId);
  });

export const getSpeakingSessionServerFn = createServerFn({
  method: "GET",
})
  .validator(sessionInputSchema)
  .handler(async ({ data }) => {
    return getSpeakingSession(data.userId, data.sessionId);
  });

export const touchSpeakingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(sessionInputSchema)
  .handler(async ({ data }) => {
    return touchSpeakingSession(data.userId, data.sessionId);
  });

export const completeSpeakingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(sessionInputSchema)
  .handler(async ({ data }) => {
    return completeSpeakingSession(data.userId, data.sessionId);
  });

export const abandonSpeakingSessionServerFn = createServerFn({
  method: "POST",
})
  .validator(sessionInputSchema)
  .handler(async ({ data }) => {
    return abandonSpeakingSession(data.userId, data.sessionId);
  });

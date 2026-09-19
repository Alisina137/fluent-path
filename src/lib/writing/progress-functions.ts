import { createServerFn } from "@tanstack/react-start";

import {
  getWritingImprovementTrends,
  getWritingSkillMetrics,
  getWritingSubmissionHistory,
} from "@/server/writing/progress/service";

export const getWritingSkillMetricsServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireAuthenticatedUserId } = await import("@/server/auth/session");

  const userId = await requireAuthenticatedUserId();

  return getWritingSkillMetrics(userId);
});

export const getWritingSubmissionHistoryServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireAuthenticatedUserId } = await import("@/server/auth/session");

  const userId = await requireAuthenticatedUserId();

  return getWritingSubmissionHistory(userId);
});

export const getWritingImprovementTrendsServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireAuthenticatedUserId } = await import("@/server/auth/session");

  const userId = await requireAuthenticatedUserId();

  return getWritingImprovementTrends(userId);
});

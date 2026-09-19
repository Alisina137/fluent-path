import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const speakingSkillMetricsInputSchema = z.object({
  userId: z.string().uuid(),
});

export const getSpeakingSkillMetricsServerFn = createServerFn({
  method: "GET",
})
  .validator(speakingSkillMetricsInputSchema)
  .handler(async ({ data }) => {
    const progressModule = await import("@/server/speaking/progress/skill-metrics");

    return progressModule.getSpeakingSkillMetrics(data.userId);
  });

const speakingSessionHistoryInputSchema = z.object({
  userId: z.string().uuid(),

  limit: z.number().int().min(1).max(100).optional(),
});

export const getSpeakingSessionHistoryServerFn = createServerFn({
  method: "GET",
})
  .validator(speakingSessionHistoryInputSchema)
  .handler(async ({ data }) => {
    const historyModule = await import("@/server/speaking/progress/session-history");

    return historyModule.getSpeakingSessionHistory(data.userId, {
      limit: data.limit,
    });
  });

const speakingImprovementTrendsInputSchema = z.object({
  userId: z.string().uuid(),
});

export const getSpeakingImprovementTrendsServerFn = createServerFn({
  method: "GET",
})
  .validator(speakingImprovementTrendsInputSchema)
  .handler(async ({ data }) => {
    const trendModule = await import("@/server/speaking/progress/improvement-trends");

    return trendModule.getSpeakingImprovementTrends(data.userId);
  });

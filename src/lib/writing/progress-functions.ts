import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getWritingImprovementTrends,
  getWritingSkillMetrics,
  getWritingSubmissionHistory,
} from "@/server/writing/progress/service";

const writingProgressRequestSchema = z
  .object({
    userId: z.string().uuid(),
  })
  .strict();

export const getWritingSkillMetricsServerFn = createServerFn({
  method: "GET",
})
  .validator((data: unknown) => writingProgressRequestSchema.parse(data))
  .handler(async ({ data }) => {
    return getWritingSkillMetrics(data.userId);
  });

export const getWritingSubmissionHistoryServerFn = createServerFn({
  method: "GET",
})
  .validator((data: unknown) => writingProgressRequestSchema.parse(data))
  .handler(async ({ data }) => {
    return getWritingSubmissionHistory(data.userId);
  });

export const getWritingImprovementTrendsServerFn = createServerFn({
  method: "GET",
})
  .validator((data: unknown) => writingProgressRequestSchema.parse(data))
  .handler(async ({ data }) => {
    return getWritingImprovementTrends(data.userId);
  });

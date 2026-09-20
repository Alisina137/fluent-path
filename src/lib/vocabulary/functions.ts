import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getVocabularyDashboard, getVocabularyReviewQueue, reviewVocabularyWord, startVocabularyWord, vocabularyCefrLevels } from "@/server/vocabulary/service";
import { vocabularyReviewRatings } from "@/db/schema/vocabulary";

const filters = z.object({
  level: z.enum(vocabularyCefrLevels).optional(),
  topic: z.string().trim().min(1).max(100).optional(),
  query: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(10).max(60).default(30),
}).strict();
const wordInput = z.object({ wordId: z.string().uuid() }).strict();
const reviewInput = z.object({ wordId: z.string().uuid(), rating: z.enum(vocabularyReviewRatings) }).strict();

async function userId() {
  const { requireAuthenticatedUserId } = await import("@/server/auth/session");
  return requireAuthenticatedUserId();
}

export const getVocabularyDashboardServerFn = createServerFn({ method: "GET" }).validator(filters).handler(async ({ data }) =>
  getVocabularyDashboard(await userId(), data.level, data.topic, data.query, data.page, data.pageSize),
);
export const startVocabularyWordServerFn = createServerFn({ method: "POST" }).validator(wordInput).handler(async ({ data }) =>
  startVocabularyWord(await userId(), data.wordId),
);
export const getVocabularyReviewQueueServerFn = createServerFn({ method: "GET" }).handler(async () =>
  getVocabularyReviewQueue(await userId()),
);
export const reviewVocabularyWordServerFn = createServerFn({ method: "POST" }).validator(reviewInput).handler(async ({ data }) =>
  reviewVocabularyWord(await userId(), data.wordId, data.rating),
);

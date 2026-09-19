import { and, asc, count, eq, lte, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { userLanguageSettings, userVocabulary, vocabularyReviews, vocabularyWords } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";
import type { VocabularyReviewRating } from "@/db/schema/vocabulary";

export const vocabularyCefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type VocabularyCefrLevel = (typeof vocabularyCefrLevels)[number];

const DAY_MS = 86_400_000;

function nextSchedule(rating: VocabularyReviewRating, interval: number, ease: number) {
  if (rating === "again") return { interval: 0, ease: Math.max(130, ease - 20), streakDelta: 0 };
  if (rating === "hard") return { interval: Math.max(1, Math.round(Math.max(1, interval) * 1.2)), ease: Math.max(130, ease - 15), streakDelta: 1 };
  if (rating === "easy") return { interval: Math.max(4, Math.round(Math.max(1, interval) * (ease / 100 + 0.3))), ease: Math.min(300, ease + 15), streakDelta: 1 };
  return { interval: Math.max(1, Math.round(Math.max(1, interval) * (ease / 100))), ease, streakDelta: 1 };
}

export async function getVocabularyDashboard(userId: string, level?: VocabularyCefrLevel, topic?: string) {
  await requireServerModuleAccess(userId, MODULE_IDS.vocabulary);
  const db = getDb();
  const now = new Date();
  const filters = [eq(vocabularyWords.isActive, 1)];
  if (level) filters.push(eq(vocabularyWords.cefrLevel, level));
  if (topic?.trim()) filters.push(eq(vocabularyWords.topic, topic.trim()));

  const [settings, words, topics, dueRows, learnedRows, reviewRows] = await Promise.all([
    db.select({ nativeLanguageCode: userLanguageSettings.nativeLanguageCode }).from(userLanguageSettings).where(eq(userLanguageSettings.userId, userId)).limit(1),
    db.select({
      id: vocabularyWords.id, term: vocabularyWords.term, partOfSpeech: vocabularyWords.partOfSpeech,
      definition: vocabularyWords.definition, example: vocabularyWords.example, cefrLevel: vocabularyWords.cefrLevel,
      topic: vocabularyWords.topic, synonyms: vocabularyWords.synonyms, translations: vocabularyWords.translations,
      status: userVocabulary.status, dueAt: userVocabulary.dueAt, reviewCount: userVocabulary.reviewCount,
    }).from(vocabularyWords).leftJoin(userVocabulary, and(eq(userVocabulary.wordId, vocabularyWords.id), eq(userVocabulary.userId, userId)))
      .where(and(...filters)).orderBy(asc(vocabularyWords.cefrLevel), asc(vocabularyWords.sortOrder)).limit(100),
    db.selectDistinct({ topic: vocabularyWords.topic }).from(vocabularyWords).where(eq(vocabularyWords.isActive, 1)).orderBy(asc(vocabularyWords.topic)),
    db.select({ count: count() }).from(userVocabulary).where(and(eq(userVocabulary.userId, userId), lte(userVocabulary.dueAt, now))),
    db.select({ count: count() }).from(userVocabulary).where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.status, "mastered"))),
    db.select({ count: count() }).from(vocabularyReviews).where(eq(vocabularyReviews.userId, userId)),
  ]);

  const languageCode = settings[0]?.nativeLanguageCode ?? "en";
  return {
    words: words.map((word) => ({ ...word, translation: word.translations[languageCode] ?? word.translations.en ?? null })),
    topics: topics.map((row) => row.topic),
    stats: { due: Number(dueRows[0]?.count ?? 0), mastered: Number(learnedRows[0]?.count ?? 0), reviews: Number(reviewRows[0]?.count ?? 0) },
    nativeLanguageCode: languageCode,
  };
}

export async function startVocabularyWord(userId: string, wordId: string) {
  await requireServerModuleAccess(userId, MODULE_IDS.vocabulary);
  const db = getDb();
  const [word] = await db.select({ id: vocabularyWords.id }).from(vocabularyWords)
    .where(and(eq(vocabularyWords.id, wordId), eq(vocabularyWords.isActive, 1))).limit(1);
  if (!word) throw new Error("Vocabulary word not found.");
  await db.insert(userVocabulary).values({ userId, wordId }).onConflictDoNothing();
  return { success: true };
}

export async function getVocabularyReviewQueue(userId: string, limit = 20) {
  await requireServerModuleAccess(userId, MODULE_IDS.vocabulary);
  const db = getDb();
  const now = new Date();
  const rows = await db.select({
    id: vocabularyWords.id, term: vocabularyWords.term, partOfSpeech: vocabularyWords.partOfSpeech,
    definition: vocabularyWords.definition, example: vocabularyWords.example, cefrLevel: vocabularyWords.cefrLevel,
    topic: vocabularyWords.topic, translations: vocabularyWords.translations, intervalDays: userVocabulary.intervalDays,
  }).from(userVocabulary).innerJoin(vocabularyWords, eq(vocabularyWords.id, userVocabulary.wordId))
    .where(and(eq(userVocabulary.userId, userId), eq(vocabularyWords.isActive, 1), lte(userVocabulary.dueAt, now)))
    .orderBy(asc(userVocabulary.dueAt)).limit(limit);
  const [settings] = await db.select({ code: userLanguageSettings.nativeLanguageCode }).from(userLanguageSettings).where(eq(userLanguageSettings.userId, userId)).limit(1);
  const code = settings?.code ?? "en";
  return rows.map((row) => ({ ...row, translation: row.translations[code] ?? row.translations.en ?? null }));
}

export async function reviewVocabularyWord(userId: string, wordId: string, rating: VocabularyReviewRating) {
  await requireServerModuleAccess(userId, MODULE_IDS.vocabulary);
  const db = getDb();
  const [state] = await db.select().from(userVocabulary).where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.wordId, wordId))).limit(1);
  if (!state) throw new Error("Start learning this word before reviewing it.");
  const schedule = nextSchedule(rating, state.intervalDays, state.easeFactor);
  const now = new Date();
  const dueAt = new Date(now.getTime() + schedule.interval * DAY_MS);
  const streak = rating === "again" ? 0 : state.correctStreak + schedule.streakDelta;
  const status = schedule.interval >= 21 && streak >= 3 ? "mastered" : "learning";

  await db.transaction(async (tx) => {
    await tx.update(userVocabulary).set({
      intervalDays: schedule.interval, easeFactor: schedule.ease, reviewCount: state.reviewCount + 1,
      correctStreak: streak, lapseCount: state.lapseCount + (rating === "again" ? 1 : 0),
      dueAt, lastReviewedAt: now, status, updatedAt: now,
    }).where(eq(userVocabulary.id, state.id));
    await tx.insert(vocabularyReviews).values({ userId, wordId, rating, previousIntervalDays: state.intervalDays, nextIntervalDays: schedule.interval });
  });
  return { success: true, dueAt, status, intervalDays: schedule.interval };
}

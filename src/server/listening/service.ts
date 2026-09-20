import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { listeningAttempts, listeningLessons, listeningQuestions, userListeningProgress } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export interface ListeningFilters {
  level?: string;
  topic?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordDistance(expected: string[], actual: string[]) {
  const matrix = Array.from({ length: expected.length + 1 }, () => Array<number>(actual.length + 1).fill(0));
  for (let i = 0; i <= expected.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= actual.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= expected.length; i += 1) {
    for (let j = 1; j <= actual.length; j += 1) {
      const cost = expected[i - 1] === actual[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[expected.length][actual.length];
}

async function requireLesson(lessonId: string) {
  const db = getDb();
  const [lesson] = await db.select().from(listeningLessons)
    .where(and(eq(listeningLessons.id, lessonId), eq(listeningLessons.isActive, 1))).limit(1);
  if (!lesson) throw new Error("Listening lesson not found.");
  return lesson;
}

async function updateProgress(userId: string, lessonId: string, values: {
  comprehensionScore?: number;
  dictationScore?: number;
  listeningSeconds?: number;
  shadowingIncrement?: number;
}) {
  const db = getDb();
  const [current] = await db.select().from(userListeningProgress)
    .where(and(eq(userListeningProgress.userId, userId), eq(userListeningProgress.lessonId, lessonId))).limit(1);
  const now = new Date();
  const next = {
    bestComprehensionScore: Math.max(current?.bestComprehensionScore ?? 0, values.comprehensionScore ?? 0),
    bestDictationScore: Math.max(current?.bestDictationScore ?? 0, values.dictationScore ?? 0),
    listeningSeconds: (current?.listeningSeconds ?? 0) + (values.listeningSeconds ?? 0),
    shadowingCount: (current?.shadowingCount ?? 0) + (values.shadowingIncrement ?? 0),
  };
  const completed = next.bestComprehensionScore >= 60 || next.bestDictationScore >= 75 ? 1 : current?.completed ?? 0;
  if (current) {
    await db.update(userListeningProgress).set({ ...next, completed, lastPracticedAt: now, updatedAt: now })
      .where(eq(userListeningProgress.id, current.id));
  } else {
    await db.insert(userListeningProgress).values({ userId, lessonId, ...next, completed, lastPracticedAt: now });
  }
}

export async function getListeningDashboard(userId: string, filters: ListeningFilters = {}) {
  await requireServerModuleAccess(userId, MODULE_IDS.listening);
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(30, Math.max(6, filters.pageSize ?? 12));
  const conditions = [eq(listeningLessons.isActive, 1)];
  if (filters.level) conditions.push(eq(listeningLessons.cefrLevel, filters.level));
  if (filters.topic) conditions.push(eq(listeningLessons.topic, filters.topic));
  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    conditions.push(or(ilike(listeningLessons.title, pattern), ilike(listeningLessons.description, pattern), ilike(listeningLessons.topic, pattern))!);
  }
  const where = and(...conditions);
  const [lessons, totalRows, topicRows, summaryRows] = await Promise.all([
    db.select({
      id: listeningLessons.id,
      title: listeningLessons.title,
      description: listeningLessons.description,
      cefrLevel: listeningLessons.cefrLevel,
      topic: listeningLessons.topic,
      accent: listeningLessons.accent,
      durationSeconds: listeningLessons.durationSeconds,
      completed: userListeningProgress.completed,
      comprehensionScore: userListeningProgress.bestComprehensionScore,
      dictationScore: userListeningProgress.bestDictationScore,
    }).from(listeningLessons).leftJoin(userListeningProgress,
      and(eq(userListeningProgress.lessonId, listeningLessons.id), eq(userListeningProgress.userId, userId)))
      .where(where).orderBy(asc(listeningLessons.sortOrder), asc(listeningLessons.title))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: count() }).from(listeningLessons).where(where),
    db.selectDistinct({ topic: listeningLessons.topic }).from(listeningLessons)
      .where(eq(listeningLessons.isActive, 1)).orderBy(asc(listeningLessons.topic)),
    db.select({
      completed: sql<number>`coalesce(sum(${userListeningProgress.completed}), 0)`,
      seconds: sql<number>`coalesce(sum(${userListeningProgress.listeningSeconds}), 0)`,
      shadowing: sql<number>`coalesce(sum(${userListeningProgress.shadowingCount}), 0)`,
      dictationAverage: sql<number>`coalesce(avg(nullif(${userListeningProgress.bestDictationScore}, 0)), 0)`,
    }).from(userListeningProgress).where(eq(userListeningProgress.userId, userId)),
  ]);
  const total = Number(totalRows[0]?.count ?? 0);
  const summary = summaryRows[0];
  return {
    lessons,
    topics: topicRows.map((row) => row.topic),
    stats: {
      completed: Number(summary?.completed ?? 0),
      listeningMinutes: Math.round(Number(summary?.seconds ?? 0) / 60),
      shadowingSessions: Number(summary?.shadowing ?? 0),
      dictationAverage: Math.round(Number(summary?.dictationAverage ?? 0)),
    },
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getListeningLesson(userId: string, lessonId: string) {
  await requireServerModuleAccess(userId, MODULE_IDS.listening);
  const db = getDb();
  const lesson = await requireLesson(lessonId);
  const questions = await db.select({
    id: listeningQuestions.id,
    prompt: listeningQuestions.prompt,
    options: listeningQuestions.options,
    sortOrder: listeningQuestions.sortOrder,
  }).from(listeningQuestions).where(eq(listeningQuestions.lessonId, lessonId)).orderBy(asc(listeningQuestions.sortOrder));
  const [progress] = await db.select().from(userListeningProgress)
    .where(and(eq(userListeningProgress.userId, userId), eq(userListeningProgress.lessonId, lessonId))).limit(1);
  return { ...lesson, questions, progress: progress ?? null };
}

export async function submitListeningComprehension(userId: string, lessonId: string, answers: number[]) {
  await requireServerModuleAccess(userId, MODULE_IDS.listening);
  const db = getDb();
  const lesson = await requireLesson(lessonId);
  const questions = await db.select().from(listeningQuestions)
    .where(eq(listeningQuestions.lessonId, lessonId)).orderBy(asc(listeningQuestions.sortOrder));
  if (!questions.length || answers.length !== questions.length) throw new Error("Answer every comprehension question.");
  const results = questions.map((question, index) => ({
    questionId: question.id,
    correct: answers[index] === question.answerIndex,
    correctAnswer: question.answerIndex,
    explanation: question.explanation,
  }));
  const correct = results.filter((result) => result.correct).length;
  const score = Math.round((correct / questions.length) * 100);
  await db.insert(listeningAttempts).values({
    userId, lessonId, mode: "comprehension", score,
    response: { answers, results }, durationSeconds: lesson.durationSeconds,
  });
  await updateProgress(userId, lessonId, { comprehensionScore: score, listeningSeconds: lesson.durationSeconds });
  return { score, correct, total: questions.length, results };
}

export async function submitListeningDictation(userId: string, lessonId: string, answer: string) {
  await requireServerModuleAccess(userId, MODULE_IDS.listening);
  const db = getDb();
  const lesson = await requireLesson(lessonId);
  const expected = normalizeText(lesson.transcript).split(" ").filter(Boolean);
  const actual = normalizeText(answer).split(" ").filter(Boolean);
  const score = Math.max(0, Math.round((1 - wordDistance(expected, actual) / Math.max(1, expected.length)) * 100));
  await db.insert(listeningAttempts).values({
    userId, lessonId, mode: "dictation", score,
    response: { answer }, durationSeconds: lesson.durationSeconds,
  });
  await updateProgress(userId, lessonId, { dictationScore: score, listeningSeconds: lesson.durationSeconds });
  return { score, expected: lesson.transcript };
}

export async function recordListeningShadowing(userId: string, lessonId: string, durationSeconds: number) {
  await requireServerModuleAccess(userId, MODULE_IDS.listening);
  const db = getDb();
  await requireLesson(lessonId);
  const safeDuration = Math.max(1, Math.min(900, Math.round(durationSeconds)));
  await db.insert(listeningAttempts).values({
    userId, lessonId, mode: "shadowing", response: { recordedLocally: true }, durationSeconds: safeDuration,
  });
  await updateProgress(userId, lessonId, { listeningSeconds: safeDuration, shadowingIncrement: 1 });
  return { success: true, durationSeconds: safeDuration };
}

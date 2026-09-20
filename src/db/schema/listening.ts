import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const listeningAttemptModes = ["comprehension", "dictation", "shadowing"] as const;
export type ListeningAttemptMode = (typeof listeningAttemptModes)[number];

export const listeningLessons = pgTable(
  "listening_lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    cefrLevel: text("cefr_level").notNull(),
    topic: text("topic").notNull(),
    accent: text("accent").notNull().default("General English"),
    transcript: text("transcript").notNull(),
    audioUrl: text("audio_url"),
    durationSeconds: integer("duration_seconds").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("listening_lessons_slug_uidx").on(table.slug),
    index("listening_lessons_active_level_topic_idx").on(table.isActive, table.cefrLevel, table.topic),
  ],
);

export const listeningQuestions = pgTable(
  "listening_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id").notNull().references(() => listeningLessons.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("listening_questions_lesson_sort_idx").on(table.lessonId, table.sortOrder)],
);

export const listeningAttempts = pgTable(
  "listening_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull().references(() => listeningLessons.id, { onDelete: "cascade" }),
    mode: text("mode", { enum: listeningAttemptModes }).notNull(),
    score: integer("score").notNull().default(0),
    maxScore: integer("max_score").notNull().default(100),
    response: jsonb("response").$type<Record<string, unknown>>().notNull().default({}),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("listening_attempts_user_created_idx").on(table.userId, table.createdAt),
    index("listening_attempts_user_lesson_idx").on(table.userId, table.lessonId),
  ],
);

export const userListeningProgress = pgTable(
  "user_listening_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull().references(() => listeningLessons.id, { onDelete: "cascade" }),
    completed: integer("completed").notNull().default(0),
    bestComprehensionScore: integer("best_comprehension_score").notNull().default(0),
    bestDictationScore: integer("best_dictation_score").notNull().default(0),
    listeningSeconds: integer("listening_seconds").notNull().default(0),
    shadowingCount: integer("shadowing_count").notNull().default(0),
    lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_listening_progress_user_lesson_uidx").on(table.userId, table.lessonId),
    index("user_listening_progress_user_practiced_idx").on(table.userId, table.lastPracticedAt),
  ],
);

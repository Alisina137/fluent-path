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

export const vocabularyReviewRatings = ["again", "hard", "good", "easy"] as const;
export type VocabularyReviewRating = (typeof vocabularyReviewRatings)[number];

export const vocabularyWords = pgTable(
  "vocabulary_words",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    term: text("term").notNull(),
    partOfSpeech: text("part_of_speech").notNull(),
    definition: text("definition").notNull(),
    example: text("example").notNull(),
    cefrLevel: text("cefr_level").notNull(),
    topic: text("topic").notNull(),
    synonyms: text("synonyms").array().notNull().default([]),
    translations: jsonb("translations").$type<Record<string, string>>().notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("vocabulary_words_term_cefr_uidx").on(table.term, table.cefrLevel),
    index("vocabulary_words_active_level_topic_idx").on(table.isActive, table.cefrLevel, table.topic),
  ],
);

export const userVocabulary = pgTable(
  "user_vocabulary",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    wordId: uuid("word_id").notNull().references(() => vocabularyWords.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("learning"),
    intervalDays: integer("interval_days").notNull().default(0),
    easeFactor: integer("ease_factor").notNull().default(250),
    reviewCount: integer("review_count").notNull().default(0),
    correctStreak: integer("correct_streak").notNull().default(0),
    lapseCount: integer("lapse_count").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_vocabulary_user_word_uidx").on(table.userId, table.wordId),
    index("user_vocabulary_user_due_idx").on(table.userId, table.dueAt),
    index("user_vocabulary_user_status_idx").on(table.userId, table.status),
  ],
);

export const vocabularyReviews = pgTable(
  "vocabulary_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    wordId: uuid("word_id").notNull().references(() => vocabularyWords.id, { onDelete: "cascade" }),
    rating: text("rating", { enum: vocabularyReviewRatings }).notNull(),
    previousIntervalDays: integer("previous_interval_days").notNull(),
    nextIntervalDays: integer("next_interval_days").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("vocabulary_reviews_user_reviewed_idx").on(table.userId, table.reviewedAt),
    index("vocabulary_reviews_word_reviewed_idx").on(table.wordId, table.reviewedAt),
  ],
);

export type VocabularyWordRow = typeof vocabularyWords.$inferSelect;
export type UserVocabularyRow = typeof userVocabulary.$inferSelect;
export type VocabularyReviewRow = typeof vocabularyReviews.$inferSelect;

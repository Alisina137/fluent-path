import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  englishLevel: text("english_level"),

  learningGoals: text("learning_goals").array().notNull().default([]),

  dailyLearningTime: integer("daily_learning_time").notNull().default(15),

  learningPreferences: text("learning_preferences").array().notNull().default([]),

  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
});

export const userLanguageSettings = pgTable("user_language_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  nativeLanguageCode: text("native_language_code").notNull().default("en"),

  translationEnabled: boolean("translation_enabled").notNull().default(true),

  preferredTranslationMode: text("preferred_translation_mode").notNull().default("on_tap"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
});

export type UserProfileRow = typeof userProfiles.$inferSelect;
export type NewUserProfileRow = typeof userProfiles.$inferInsert;

export type UserLanguageSettingsRow = typeof userLanguageSettings.$inferSelect;

import {
  boolean,
  integer,
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    status: text("status").notNull().default("in_progress"),

    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),

    durationMs: integer("duration_ms").notNull().default(0),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("assessment_attempts_user_started_at_idx").on(table.userId, table.startedAt)],
);

export const assessmentAnswers = pgTable("assessment_answers", {
  id: uuid("id").defaultRandom().primaryKey(),

  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => assessmentAttempts.id, {
      onDelete: "cascade",
    }),

  questionId: text("question_id").notNull(),

  skill: text("skill").notNull(),

  difficulty: text("difficulty").notNull(),

  answerValue: jsonb("answer_value"),

  isCorrect: boolean("is_correct").notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
});

export const assessmentResults = pgTable("assessment_results", {
  attemptId: uuid("attempt_id")
    .primaryKey()
    .references(() => assessmentAttempts.id, {
      onDelete: "cascade",
    }),

  overallPercentage: integer("overall_percentage").notNull(),

  estimatedLevel: text("estimated_level").notNull(),

  confidence: integer("confidence").notNull(),

  durationMs: integer("duration_ms").notNull(),

  completedAt: timestamp("completed_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
});

export const assessmentSkillScores = pgTable(
  "assessment_skill_scores",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => assessmentAttempts.id, {
        onDelete: "cascade",
      }),

    skill: text("skill").notNull(),

    correct: integer("correct").notNull(),

    total: integer("total").notNull(),

    weightedCorrect: numeric("weighted_correct", {
      precision: 8,
      scale: 2,
    }).notNull(),

    weightedTotal: numeric("weighted_total", {
      precision: 8,
      scale: 2,
    }).notNull(),

    percentage: integer("percentage").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.attemptId, table.skill],
    }),
  ],
);

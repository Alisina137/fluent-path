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

import { modules } from "./modules";
import { users } from "./users";

/*
 * Writing tasks
 *
 * Reusable writing exercises available to learners.
 * Sessions preserve their own task snapshot so historical
 * sessions do not change if a task is later edited.
 */

export const writingTasks = pgTable(
  "writing_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: text("title").notNull(),

    prompt: text("prompt").notNull(),

    description: text("description"),

    category: text("category").notNull(),

    writingType: text("writing_type").notNull(),

    cefrLevel: text("cefr_level").notNull(),

    minWords: integer("min_words"),

    maxWords: integer("max_words"),

    audience: text("audience"),

    purpose: text("purpose"),

    tone: text("tone"),

    estimatedMinutes: integer("estimated_minutes"),

    sortOrder: integer("sort_order").notNull().default(0),

    isActive: integer("is_active").notNull().default(1),

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
  },
  (table) => [
    index("writing_tasks_cefr_category_idx").on(table.cefrLevel, table.category),

    index("writing_tasks_active_idx").on(table.isActive),

    index("writing_tasks_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
);

export const writingSessionStatuses = ["active", "completed", "abandoned"] as const;

export type WritingSessionStatus = (typeof writingSessionStatuses)[number];

export const writingSessions = pgTable(
  "writing_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, {
        onDelete: "restrict",
      }),

    taskId: uuid("task_id").references(() => writingTasks.id, {
      onDelete: "set null",
    }),

    status: text("status", {
      enum: writingSessionStatuses,
    })
      .notNull()
      .default("active"),

    title: text("title"),

    writingType: text("writing_type").notNull(),

    targetCefrLevel: text("target_cefr_level").notNull(),

    /*
     * Immutable historical representation of the task/context
     * presented when this session was created.
     *
     * The concrete validated TypeScript structure will live
     * outside the database schema.
     */
    taskSnapshot: jsonb("task_snapshot")
      .$type<{
        source: "task" | "custom";
        title: string | null;
        prompt: string | null;
        category: string | null;
        writingType: string;
        cefrLevel: string;
        minWords: number | null;
        maxWords: number | null;
        audience: string | null;
        purpose: string | null;
        tone: string | null;
      }>()
      .notNull(),

    startedAt: timestamp("started_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),

    abandonedAt: timestamp("abandoned_at", {
      withTimezone: true,
      mode: "date",
    }),

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
  },
  (table) => [
    index("writing_sessions_user_started_at_idx").on(table.userId, table.startedAt),

    index("writing_sessions_user_status_idx").on(table.userId, table.status),

    index("writing_sessions_task_idx").on(table.taskId),
  ],
);

/*
 * Mutable working draft.
 *
 * A session has at most one current draft.
 * Editing/autosaving updates this record rather than creating
 * hundreds of historical revisions.
 */

export const writingDrafts = pgTable(
  "writing_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => writingSessions.id, {
        onDelete: "cascade",
      }),

    content: text("content").notNull().default(""),

    wordCount: integer("word_count").notNull().default(0),

    characterCount: integer("character_count").notNull().default(0),

    lastSavedAt: timestamp("last_saved_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

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
  },
  (table) => [uniqueIndex("writing_drafts_session_uidx").on(table.sessionId)],
);

/*
 * Immutable submitted snapshots.
 *
 * Once a revision has been submitted for evaluation its
 * content must never be overwritten by editor autosave.
 */

export const writingRevisions = pgTable(
  "writing_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => writingSessions.id, {
        onDelete: "cascade",
      }),

    revisionNumber: integer("revision_number").notNull(),

    content: text("content").notNull(),

    wordCount: integer("word_count").notNull(),

    characterCount: integer("character_count").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("writing_revisions_session_number_uidx").on(table.sessionId, table.revisionNumber),

    index("writing_revisions_session_created_at_idx").on(table.sessionId, table.createdAt),
  ],
);

/*
 * One persisted structured AI evaluation per submitted revision.
 *
 * Re-reading an evaluated revision should return the stored
 * evaluation instead of automatically creating another paid
 * provider request.
 */

export const writingEvaluations = pgTable(
  "writing_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    revisionId: uuid("revision_id")
      .notNull()
      .references(() => writingRevisions.id, {
        onDelete: "cascade",
      }),

    overallScore: integer("overall_score").notNull(),

    grammarScore: integer("grammar_score").notNull(),

    vocabularyScore: integer("vocabulary_score").notNull(),

    coherenceScore: integer("coherence_score").notNull(),

    taskAchievementScore: integer("task_achievement_score").notNull(),

    mechanicsScore: integer("mechanics_score").notNull(),

    evaluation: jsonb("evaluation").notNull(),

    provider: text("provider").notNull(),

    model: text("model").notNull(),

    providerRequestId: text("provider_request_id"),

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
  },
  (table) => [
    uniqueIndex("writing_evaluations_revision_uidx").on(table.revisionId),

    index("writing_evaluations_created_at_idx").on(table.createdAt),
  ],
);

export type WritingTaskRow = typeof writingTasks.$inferSelect;
export type NewWritingTaskRow = typeof writingTasks.$inferInsert;

export type WritingSessionRow = typeof writingSessions.$inferSelect;
export type NewWritingSessionRow = typeof writingSessions.$inferInsert;

export type WritingDraftRow = typeof writingDrafts.$inferSelect;
export type NewWritingDraftRow = typeof writingDrafts.$inferInsert;

export type WritingRevisionRow = typeof writingRevisions.$inferSelect;
export type NewWritingRevisionRow = typeof writingRevisions.$inferInsert;

export type WritingEvaluationRow = typeof writingEvaluations.$inferSelect;
export type NewWritingEvaluationRow = typeof writingEvaluations.$inferInsert;

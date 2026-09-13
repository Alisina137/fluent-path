import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { modules } from "./modules";
import { users } from "./users";

export const speakingSessionStatuses = ["active", "completed", "abandoned", "failed"] as const;

export type SpeakingSessionStatus = (typeof speakingSessionStatuses)[number];

export const speakingSessions = pgTable(
  "speaking_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "restrict" }),

    status: text("status", {
      enum: speakingSessionStatuses,
    })
      .notNull()
      .default("active"),

    durationMs: integer("duration_ms").notNull().default(0),

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

    failedAt: timestamp("failed_at", {
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
    index("speaking_sessions_user_started_at_idx").on(table.userId, table.startedAt),

    index("speaking_sessions_user_status_idx").on(table.userId, table.status),

    uniqueIndex("speaking_sessions_one_active_per_user_module_idx")
      .on(table.userId, table.moduleId)
      .where(sql`${table.status} = 'active'`),
  ],
);

export const speakingMessageRoles = ["user", "assistant"] as const;

export type SpeakingMessageRole = (typeof speakingMessageRoles)[number];

export const speakingMessages = pgTable(
  "speaking_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => speakingSessions.id, {
        onDelete: "cascade",
      }),

    role: text("role", {
      enum: speakingMessageRoles,
    }).notNull(),

    content: text("content").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("speaking_messages_session_created_at_idx").on(table.sessionId, table.createdAt),
  ],
);

export type SpeakingMessageRow = typeof speakingMessages.$inferSelect;
export type NewSpeakingMessageRow = typeof speakingMessages.$inferInsert;

export type SpeakingSessionRow = typeof speakingSessions.$inferSelect;
export type NewSpeakingSessionRow = typeof speakingSessions.$inferInsert;

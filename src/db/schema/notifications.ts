import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { modules } from "./modules";
import { users } from "./users";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text("type").notNull(),

    title: text("title").notNull(),

    body: text("body").notNull(),

    moduleId: text("module_id").references(() => modules.id),

    readAt: timestamp("read_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("notifications_user_created_at_idx").on(table.userId, table.createdAt)],
);

import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { modules } from "./modules";
import { users } from "./users";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: text("provider"),

    providerCustomerId: text("provider_customer_id"),

    providerSubscriptionId: text("provider_subscription_id"),

    status: text("status").notNull(),

    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
      mode: "date",
    }),

    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),

    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),

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
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_provider_subscription_id_idx").on(table.providerSubscriptionId),
  ],
);

export const userModules = pgTable(
  "user_modules",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id),

    accessStatus: text("access_status").notNull(),

    accessSource: text("access_source").notNull(),

    activatedAt: timestamp("activated_at", {
      withTimezone: true,
      mode: "date",
    }),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }),

    lastAccessedAt: timestamp("last_accessed_at", {
      withTimezone: true,
      mode: "date",
    }),

    progressPercentage: integer("progress_percentage").notNull().default(0),

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
    primaryKey({
      columns: [table.userId, table.moduleId],
    }),
    index("user_modules_module_id_idx").on(table.moduleId),
  ],
);

export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type UserModuleRow = typeof userModules.$inferSelect;

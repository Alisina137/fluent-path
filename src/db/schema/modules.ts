import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const modules = pgTable(
  "modules",
  {
    id: text("id").primaryKey(),

    slug: text("slug").notNull().unique(),

    name: text("name").notNull(),

    monthlyPriceCents: integer("monthly_price_cents").notNull(),

    releaseStatus: text("release_status").notNull().default("coming_soon"),

    featured: boolean("featured").notNull().default(false),

    displayOrder: integer("display_order").notNull(),

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
    index("modules_release_status_display_order_idx").on(table.releaseStatus, table.displayOrder),
  ],
);

export type ModuleRow = typeof modules.$inferSelect;
export type NewModuleRow = typeof modules.$inferInsert;

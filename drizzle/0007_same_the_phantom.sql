ALTER TABLE "writing_tasks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "writing_tasks" ADD COLUMN "estimated_minutes" integer;--> statement-breakpoint
ALTER TABLE "writing_tasks" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "writing_tasks_active_sort_idx" ON "writing_tasks" USING btree ("is_active","sort_order");
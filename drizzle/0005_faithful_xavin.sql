CREATE TABLE "writing_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"character_count" integer DEFAULT 0 NOT NULL,
	"last_saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"overall_score" integer NOT NULL,
	"grammar_score" integer NOT NULL,
	"vocabulary_score" integer NOT NULL,
	"coherence_score" integer NOT NULL,
	"task_achievement_score" integer NOT NULL,
	"mechanics_score" integer NOT NULL,
	"evaluation" jsonb NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"provider_request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"character_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" text NOT NULL,
	"task_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"title" text,
	"writing_type" text NOT NULL,
	"target_cefr_level" text NOT NULL,
	"task_snapshot" jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"category" text NOT NULL,
	"writing_type" text NOT NULL,
	"cefr_level" text NOT NULL,
	"min_words" integer,
	"max_words" integer,
	"audience" text,
	"purpose" text,
	"tone" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "writing_drafts" ADD CONSTRAINT "writing_drafts_session_id_writing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."writing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_evaluations" ADD CONSTRAINT "writing_evaluations_revision_id_writing_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."writing_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_revisions" ADD CONSTRAINT "writing_revisions_session_id_writing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."writing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_sessions" ADD CONSTRAINT "writing_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_sessions" ADD CONSTRAINT "writing_sessions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_sessions" ADD CONSTRAINT "writing_sessions_task_id_writing_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."writing_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "writing_drafts_session_uidx" ON "writing_drafts" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_evaluations_revision_uidx" ON "writing_evaluations" USING btree ("revision_id");--> statement-breakpoint
CREATE INDEX "writing_evaluations_created_at_idx" ON "writing_evaluations" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_revisions_session_number_uidx" ON "writing_revisions" USING btree ("session_id","revision_number");--> statement-breakpoint
CREATE INDEX "writing_revisions_session_created_at_idx" ON "writing_revisions" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "writing_sessions_user_started_at_idx" ON "writing_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "writing_sessions_user_status_idx" ON "writing_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "writing_sessions_task_idx" ON "writing_sessions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "writing_tasks_cefr_category_idx" ON "writing_tasks" USING btree ("cefr_level","category");--> statement-breakpoint
CREATE INDEX "writing_tasks_active_idx" ON "writing_tasks" USING btree ("is_active");
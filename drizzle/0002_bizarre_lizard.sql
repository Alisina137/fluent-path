CREATE TABLE "speaking_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speaking_sessions" ADD CONSTRAINT "speaking_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_sessions" ADD CONSTRAINT "speaking_sessions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "speaking_sessions_user_started_at_idx" ON "speaking_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "speaking_sessions_user_status_idx" ON "speaking_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "speaking_sessions_one_active_per_user_module_idx" ON "speaking_sessions" USING btree ("user_id","module_id") WHERE "speaking_sessions"."status" = 'active';
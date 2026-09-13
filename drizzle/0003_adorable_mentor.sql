CREATE TABLE "speaking_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speaking_messages" ADD CONSTRAINT "speaking_messages_session_id_speaking_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."speaking_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "speaking_messages_session_created_at_idx" ON "speaking_messages" USING btree ("session_id","created_at");
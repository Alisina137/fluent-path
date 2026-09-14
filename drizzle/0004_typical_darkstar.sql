CREATE TABLE "speaking_feedback_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"skill" text NOT NULL,
	"score" integer NOT NULL,
	"evaluation" jsonb NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"provider_request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speaking_feedback_evaluations" ADD CONSTRAINT "speaking_feedback_evaluations_message_id_speaking_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."speaking_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "speaking_feedback_message_skill_uidx" ON "speaking_feedback_evaluations" USING btree ("message_id","skill");--> statement-breakpoint
CREATE INDEX "speaking_feedback_message_idx" ON "speaking_feedback_evaluations" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "speaking_feedback_skill_created_at_idx" ON "speaking_feedback_evaluations" USING btree ("skill","created_at");
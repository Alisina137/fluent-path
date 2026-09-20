CREATE TABLE IF NOT EXISTS "listening_lessons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "cefr_level" text NOT NULL,
  "topic" text NOT NULL,
  "accent" text DEFAULT 'General English' NOT NULL,
  "transcript" text NOT NULL,
  "audio_url" text,
  "duration_seconds" integer NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "listening_lessons_slug_uidx" ON "listening_lessons" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listening_lessons_active_level_topic_idx" ON "listening_lessons" USING btree ("is_active","cefr_level","topic");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listening_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL REFERENCES "listening_lessons"("id") ON DELETE cascade,
  "prompt" text NOT NULL,
  "options" jsonb NOT NULL,
  "answer_index" integer NOT NULL,
  "explanation" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listening_questions_lesson_sort_idx" ON "listening_questions" USING btree ("lesson_id","sort_order");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listening_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "lesson_id" uuid NOT NULL REFERENCES "listening_lessons"("id") ON DELETE cascade,
  "mode" text NOT NULL,
  "score" integer DEFAULT 0 NOT NULL,
  "max_score" integer DEFAULT 100 NOT NULL,
  "response" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "duration_seconds" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listening_attempts_user_created_idx" ON "listening_attempts" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listening_attempts_user_lesson_idx" ON "listening_attempts" USING btree ("user_id","lesson_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_listening_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "lesson_id" uuid NOT NULL REFERENCES "listening_lessons"("id") ON DELETE cascade,
  "completed" integer DEFAULT 0 NOT NULL,
  "best_comprehension_score" integer DEFAULT 0 NOT NULL,
  "best_dictation_score" integer DEFAULT 0 NOT NULL,
  "listening_seconds" integer DEFAULT 0 NOT NULL,
  "shadowing_count" integer DEFAULT 0 NOT NULL,
  "last_practiced_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_listening_progress_user_lesson_uidx" ON "user_listening_progress" USING btree ("user_id","lesson_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_listening_progress_user_practiced_idx" ON "user_listening_progress" USING btree ("user_id","last_practiced_at");
--> statement-breakpoint
UPDATE "modules" SET "release_status" = 'available', "updated_at" = now() WHERE "id" = 'listening';
--> statement-breakpoint
INSERT INTO "listening_lessons" ("slug","title","description","cefr_level","topic","accent","transcript","duration_seconds","sort_order")
VALUES
('morning-routine','A Busy Morning','Follow a simple description of a morning routine.','A1','Daily Life','General American','Every morning, Maya wakes up at seven. She makes tea, eats bread and fruit, and checks the weather. At eight, she walks to the bus stop and travels to work.',40,10),
('asking-directions','Finding the Museum','Listen to a traveler ask for directions in a city.','A2','Travel','General British','Excuse me, could you tell me how to get to the city museum? Walk straight for two blocks, turn left at the bank, and cross the small bridge. The museum is opposite the park.',45,20),
('team-meeting','A Productive Team Meeting','Track decisions and responsibilities in a workplace conversation.','B1','Work','General American','During Monday''s meeting, the team agreed to move the product demo to Thursday afternoon. Lina will update the slides, Omar will test the new login flow, and Sara will send the invitation to clients before noon tomorrow.',55,30),
('weekend-travel-change','A Change of Travel Plans','Understand reasons, alternatives and timing in a travel update.','B2','Travel','General British','We had planned to take the early train to Edinburgh, but engineering work means the service will start two hours later. Instead of waiting at the station, we booked a coach that leaves at half past eight and arrives shortly after lunch.',60,40),
('remote-work-debate','The Remote Work Debate','Follow a balanced argument about workplace policy.','C1','Work','General American','Supporters of remote work point to flexibility and fewer commutes, while critics worry about weaker collaboration and mentoring. A growing number of companies are therefore experimenting with hybrid schedules that protect focused work at home while reserving office days for planning, feedback, and team connection.',70,50),
('urban-green-spaces','Why Cities Need More Green Space','Follow a compact explanation connecting environment, health and city design.','C2','Science & Society','General British','Urban green spaces do more than improve the appearance of a city. Trees reduce surface temperatures, absorb some airborne pollutants, and create quieter places for exercise and social contact. Yet the benefits are uneven when greener neighbourhoods are concentrated in wealthier districts, so planners increasingly treat access to nature as a public-health and equity issue.',80,60)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "listening_questions" ("lesson_id","prompt","options","answer_index","explanation","sort_order")
SELECT id,'What time does Maya wake up?','["Six","Seven","Eight","Nine"]'::jsonb,1,'The speaker says Maya wakes up at seven.',1 FROM "listening_lessons" WHERE slug='morning-routine'
UNION ALL SELECT id,'How does Maya travel to work?','["By car","By bicycle","By bus","By train"]'::jsonb,2,'She walks to the bus stop and travels by bus.',2 FROM "listening_lessons" WHERE slug='morning-routine'
UNION ALL SELECT id,'What should the traveler do at the bank?','["Turn left","Turn right","Take a bus","Enter the bank"]'::jsonb,0,'The directions say to turn left at the bank.',1 FROM "listening_lessons" WHERE slug='asking-directions'
UNION ALL SELECT id,'Where is the museum?','["Behind the station","Next to the bank","Opposite the park","Across from the hotel"]'::jsonb,2,'The museum is opposite the park.',2 FROM "listening_lessons" WHERE slug='asking-directions'
UNION ALL SELECT id,'When will the product demo happen?','["Monday morning","Tuesday afternoon","Thursday afternoon","Friday morning"]'::jsonb,2,'The team moved the demo to Thursday afternoon.',1 FROM "listening_lessons" WHERE slug='team-meeting'
UNION ALL SELECT id,'Who will test the login flow?','["Lina","Omar","Sara","The clients"]'::jsonb,1,'Omar is responsible for testing the new login flow.',2 FROM "listening_lessons" WHERE slug='team-meeting'
UNION ALL SELECT id,'Why did the travelers change their plan?','["The train was full","Engineering work delayed the train","They missed the train","The museum was closed"]'::jsonb,1,'Engineering work means the train service starts two hours later.',1 FROM "listening_lessons" WHERE slug='weekend-travel-change'
UNION ALL SELECT id,'What transport did they book instead?','["A flight","A ferry","A coach","A taxi"]'::jsonb,2,'They booked a coach leaving at half past eight.',2 FROM "listening_lessons" WHERE slug='weekend-travel-change'
UNION ALL SELECT id,'What concern do critics of remote work raise?','["Longer commutes","Weaker collaboration and mentoring","Higher office rent","Too many meetings"]'::jsonb,1,'Critics worry about weaker collaboration and mentoring.',1 FROM "listening_lessons" WHERE slug='remote-work-debate'
UNION ALL SELECT id,'Why do companies use office days in hybrid schedules?','["For focused solo work","For planning, feedback and team connection","To reduce salaries","To avoid technology"]'::jsonb,1,'The passage reserves office days for collaborative activities.',2 FROM "listening_lessons" WHERE slug='remote-work-debate'
UNION ALL SELECT id,'Which benefit of trees is mentioned?','["They increase traffic","They reduce surface temperatures","They raise building costs","They replace public transport"]'::jsonb,1,'Trees are described as reducing surface temperatures.',1 FROM "listening_lessons" WHERE slug='urban-green-spaces'
UNION ALL SELECT id,'What equity problem does the passage identify?','["Parks are too large","Green benefits may be concentrated in wealthier districts","Cities have too many trees","Exercise is expensive"]'::jsonb,1,'The passage notes that greener neighbourhoods can be concentrated in wealthier districts.',2 FROM "listening_lessons" WHERE slug='urban-green-spaces';

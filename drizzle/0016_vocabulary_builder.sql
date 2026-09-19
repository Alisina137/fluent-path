CREATE TABLE "vocabulary_words" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "term" text NOT NULL,
  "part_of_speech" text NOT NULL,
  "definition" text NOT NULL,
  "example" text NOT NULL,
  "cefr_level" text NOT NULL,
  "topic" text NOT NULL,
  "synonyms" text[] DEFAULT '{}' NOT NULL,
  "translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vocabulary" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "word_id" uuid NOT NULL,
  "status" text DEFAULT 'learning' NOT NULL,
  "interval_days" integer DEFAULT 0 NOT NULL,
  "ease_factor" integer DEFAULT 250 NOT NULL,
  "review_count" integer DEFAULT 0 NOT NULL,
  "correct_streak" integer DEFAULT 0 NOT NULL,
  "lapse_count" integer DEFAULT 0 NOT NULL,
  "due_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "word_id" uuid NOT NULL,
  "rating" text NOT NULL,
  "previous_interval_days" integer NOT NULL,
  "next_interval_days" integer NOT NULL,
  "reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_word_id_vocabulary_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."vocabulary_words"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vocabulary_reviews" ADD CONSTRAINT "vocabulary_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vocabulary_reviews" ADD CONSTRAINT "vocabulary_reviews_word_id_vocabulary_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."vocabulary_words"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "vocabulary_words_term_cefr_uidx" ON "vocabulary_words" USING btree ("term","cefr_level");
--> statement-breakpoint
CREATE INDEX "vocabulary_words_active_level_topic_idx" ON "vocabulary_words" USING btree ("is_active","cefr_level","topic");
--> statement-breakpoint
CREATE UNIQUE INDEX "user_vocabulary_user_word_uidx" ON "user_vocabulary" USING btree ("user_id","word_id");
--> statement-breakpoint
CREATE INDEX "user_vocabulary_user_due_idx" ON "user_vocabulary" USING btree ("user_id","due_at");
--> statement-breakpoint
CREATE INDEX "user_vocabulary_user_status_idx" ON "user_vocabulary" USING btree ("user_id","status");
--> statement-breakpoint
CREATE INDEX "vocabulary_reviews_user_reviewed_idx" ON "vocabulary_reviews" USING btree ("user_id","reviewed_at");
--> statement-breakpoint
CREATE INDEX "vocabulary_reviews_word_reviewed_idx" ON "vocabulary_reviews" USING btree ("word_id","reviewed_at");
--> statement-breakpoint
INSERT INTO "vocabulary_words" ("id","term","part_of_speech","definition","example","cefr_level","topic","synonyms","translations","sort_order","is_active") VALUES
('00000001-0000-4000-8000-000000000001','adapt','verb','to change to suit a new situation','It took me a week to adapt to the new schedule.','A1','Everyday Life',ARRAY['adjust'], '{"es":"adaptarse","fa":"سازگار شدن","ar":"يتكيف","zh":"适应","fr":"s''adapter","de":"sich anpassen","pt":"adaptar-se","hi":"अनुकूल होना","ja":"適応する","ko":"적응하다","en":"adapt"}'::jsonb, 10, 1),
('00000002-0000-4000-8000-000000000002','borrow','verb','to take and use something that belongs to someone else and return it later','Can I borrow your dictionary for a day?','A1','Everyday Life',ARRAY['use temporarily'], '{"es":"pedir prestado","fa":"قرض گرفتن","ar":"يستعير","zh":"借","fr":"emprunter","de":"ausleihen","pt":"pegar emprestado","hi":"उधार लेना","ja":"借りる","ko":"빌리다","en":"borrow"}'::jsonb, 20, 1),
('00000003-0000-4000-8000-000000000003','journey','noun','an act of travelling from one place to another','The train journey takes three hours.','A1','Travel',ARRAY['trip'], '{"es":"viaje","fa":"سفر","ar":"رحلة","zh":"旅程","fr":"voyage","de":"Reise","pt":"viagem","hi":"यात्रा","ja":"旅","ko":"여행","en":"journey"}'::jsonb, 30, 1),
('00000004-0000-4000-8000-000000000004','quiet','adjective','making little or no noise','The library is quiet in the morning.','A1','Everyday Life',ARRAY['silent','calm'], '{"es":"tranquilo","fa":"آرام","ar":"هادئ","zh":"安静的","fr":"calme","de":"ruhig","pt":"silencioso","hi":"शांत","ja":"静かな","ko":"조용한","en":"quiet"}'::jsonb, 40, 1),
('00000005-0000-4000-8000-000000000005','achieve','verb','to succeed in reaching a goal','She worked hard to achieve her goal.','A2','Goals',ARRAY['accomplish'], '{"es":"lograr","fa":"دستیابی پیدا کردن","ar":"يحقق","zh":"实现","fr":"accomplir","de":"erreichen","pt":"alcançar","hi":"प्राप्त करना","ja":"達成する","ko":"달성하다","en":"achieve"}'::jsonb, 50, 1),
('00000006-0000-4000-8000-000000000006','choice','noun','an act of choosing between possibilities','You have a choice between two courses.','A2','Everyday Life',ARRAY['option'], '{"es":"elección","fa":"انتخاب","ar":"اختيار","zh":"选择","fr":"choix","de":"Wahl","pt":"escolha","hi":"चुनाव","ja":"選択","ko":"선택","en":"choice"}'::jsonb, 60, 1),
('00000007-0000-4000-8000-000000000007','improve','verb','to become or make something better','Reading daily can improve your vocabulary.','A2','Learning',ARRAY['develop','enhance'], '{"es":"mejorar","fa":"بهبود دادن","ar":"يحسن","zh":"改善","fr":"améliorer","de":"verbessern","pt":"melhorar","hi":"सुधारना","ja":"改善する","ko":"향상시키다","en":"improve"}'::jsonb, 70, 1),
('00000008-0000-4000-8000-000000000008','prepare','verb','to make ready for something','I need to prepare for tomorrow''s meeting.','A2','Work & Study',ARRAY['get ready'], '{"es":"preparar","fa":"آماده کردن","ar":"يجهز","zh":"准备","fr":"préparer","de":"vorbereiten","pt":"preparar","hi":"तैयार करना","ja":"準備する","ko":"준비하다","en":"prepare"}'::jsonb, 80, 1),
('00000009-0000-4000-8000-000000000009','approach','noun','a way of dealing with a situation or problem','We need a different approach to this problem.','B1','Work & Study',ARRAY['method'], '{"es":"enfoque","fa":"رویکرد","ar":"نهج","zh":"方法","fr":"approche","de":"Ansatz","pt":"abordagem","hi":"दृष्टिकोण","ja":"取り組み方","ko":"접근법","en":"approach"}'::jsonb, 90, 1),
('00000010-0000-4000-8000-000000000010','confident','adjective','feeling sure about your ability or decision','He feels more confident speaking English now.','B1','Personal Development',ARRAY['self-assured'], '{"es":"seguro","fa":"بااعتمادبه‌نفس","ar":"واثق","zh":"自信的","fr":"confiant","de":"selbstbewusst","pt":"confiante","hi":"आत्मविश्वासी","ja":"自信のある","ko":"자신감 있는","en":"confident"}'::jsonb, 100, 1),
('00000011-0000-4000-8000-000000000011','evidence','noun','facts or information that support an idea or conclusion','The report provides evidence for the new policy.','B1','Academic',ARRAY['proof'], '{"es":"evidencia","fa":"شواهد","ar":"دليل","zh":"证据","fr":"preuve","de":"Beleg","pt":"evidência","hi":"साक्ष्य","ja":"証拠","ko":"증거","en":"evidence"}'::jsonb, 110, 1),
('00000012-0000-4000-8000-000000000012','maintain','verb','to keep something at the same level or in good condition','It is important to maintain a healthy routine.','B1','Health & Lifestyle',ARRAY['preserve','keep'], '{"es":"mantener","fa":"حفظ کردن","ar":"يحافظ","zh":"维持","fr":"maintenir","de":"aufrechterhalten","pt":"manter","hi":"बनाए रखना","ja":"維持する","ko":"유지하다","en":"maintain"}'::jsonb, 120, 1),
('00000013-0000-4000-8000-000000000013','consequence','noun','a result of an action or situation','One consequence of poor planning is wasted time.','B2','Academic',ARRAY['result','outcome'], '{"es":"consecuencia","fa":"پیامد","ar":"نتيجة","zh":"后果","fr":"conséquence","de":"Folge","pt":"consequência","hi":"परिणाम","ja":"結果","ko":"결과","en":"consequence"}'::jsonb, 130, 1),
('00000014-0000-4000-8000-000000000014','efficient','adjective','working well without wasting time or resources','The new process is more efficient than the old one.','B2','Work & Study',ARRAY['effective','productive'], '{"es":"eficiente","fa":"کارآمد","ar":"فعال","zh":"高效的","fr":"efficace","de":"effizient","pt":"eficiente","hi":"कुशल","ja":"効率的な","ko":"효율적인","en":"efficient"}'::jsonb, 140, 1),
('00000015-0000-4000-8000-000000000015','perspective','noun','a particular way of thinking about something','Try to see the issue from another perspective.','B2','Society & Culture',ARRAY['viewpoint'], '{"es":"perspectiva","fa":"دیدگاه","ar":"منظور","zh":"观点","fr":"perspective","de":"Perspektive","pt":"perspectiva","hi":"दृष्टिकोण","ja":"観点","ko":"관점","en":"perspective"}'::jsonb, 150, 1),
('00000016-0000-4000-8000-000000000016','significant','adjective','important or large enough to be noticed','The study found a significant improvement in results.','B2','Academic',ARRAY['important','substantial'], '{"es":"significativo","fa":"قابل‌توجه","ar":"مهم","zh":"显著的","fr":"significatif","de":"bedeutend","pt":"significativo","hi":"महत्वपूर्ण","ja":"重要な","ko":"중요한","en":"significant"}'::jsonb, 160, 1),
('00000017-0000-4000-8000-000000000017','ambiguous','adjective','having more than one possible meaning','The final sentence is ambiguous and needs clarification.','C1','Academic',ARRAY['unclear','equivocal'], '{"es":"ambiguo","fa":"مبهم","ar":"غامض","zh":"模棱两可的","fr":"ambigu","de":"mehrdeutig","pt":"ambíguo","hi":"अस्पष्ट","ja":"曖昧な","ko":"모호한","en":"ambiguous"}'::jsonb, 170, 1),
('00000018-0000-4000-8000-000000000018','coherent','adjective','logical, clear, and well organized','Her argument was coherent and easy to follow.','C1','Academic',ARRAY['logical','consistent'], '{"es":"coherente","fa":"منسجم","ar":"متماسك","zh":"连贯的","fr":"cohérent","de":"kohärent","pt":"coerente","hi":"सुसंगत","ja":"一貫した","ko":"일관된","en":"coherent"}'::jsonb, 180, 1),
('00000019-0000-4000-8000-000000000019','diminish','verb','to become or make something smaller or less important','Public interest may diminish over time.','C1','Academic',ARRAY['decrease','reduce'], '{"es":"disminuir","fa":"کاهش یافتن","ar":"يتضاءل","zh":"减少","fr":"diminuer","de":"verringern","pt":"diminuir","hi":"कम होना","ja":"減少する","ko":"줄어들다","en":"diminish"}'::jsonb, 190, 1),
('00000020-0000-4000-8000-000000000020','sustainable','adjective','able to continue for a long time without causing serious harm','The city is investing in sustainable transport.','C1','Environment',ARRAY['viable','enduring'], '{"es":"sostenible","fa":"پایدار","ar":"مستدام","zh":"可持续的","fr":"durable","de":"nachhaltig","pt":"sustentável","hi":"टिकाऊ","ja":"持続可能な","ko":"지속 가능한","en":"sustainable"}'::jsonb, 200, 1),
('00000021-0000-4000-8000-000000000021','conundrum','noun','a difficult problem or question with no obvious answer','The policy creates a conundrum for local leaders.','C2','Academic',ARRAY['dilemma','puzzle'], '{"es":"enigma","fa":"معمای دشوار","ar":"معضلة","zh":"难题","fr":"énigme","de":"Dilemma","pt":"enigma","hi":"दुविधा","ja":"難問","ko":"난제","en":"conundrum"}'::jsonb, 210, 1),
('00000022-0000-4000-8000-000000000022','nuanced','adjective','showing subtle differences or careful distinctions','The article presents a nuanced view of the debate.','C2','Academic',ARRAY['subtle','refined'], '{"es":"matizado","fa":"ظریف و دقیق","ar":"دقيق الفروق","zh":"细致入微的","fr":"nuancé","de":"differenziert","pt":"nuançado","hi":"सूक्ष्म","ja":"微妙な違いを捉えた","ko":"미묘한 차이를 반영한","en":"nuanced"}'::jsonb, 220, 1),
('00000023-0000-4000-8000-000000000023','pragmatic','adjective','dealing with problems in a practical way','They chose a pragmatic solution that could be implemented quickly.','C2','Work & Study',ARRAY['practical','realistic'], '{"es":"pragmático","fa":"عمل‌گرایانه","ar":"عملي","zh":"务实的","fr":"pragmatique","de":"pragmatisch","pt":"pragmático","hi":"व्यावहारिक","ja":"実用的な","ko":"실용적인","en":"pragmatic"}'::jsonb, 230, 1),
('00000024-0000-4000-8000-000000000024','ubiquitous','adjective','seeming to be present everywhere','Smartphones have become ubiquitous in modern life.','C2','Technology',ARRAY['omnipresent','widespread'], '{"es":"ubicuo","fa":"همه‌جا حاضر","ar":"واسع الانتشار","zh":"无处不在的","fr":"omniprésent","de":"allgegenwärtig","pt":"onipresente","hi":"सर्वव्यापी","ja":"至る所にある","ko":"어디에나 있는","en":"ubiquitous"}'::jsonb, 240, 1)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "modules" SET "release_status" = 'available', "updated_at" = NOW() WHERE "id" = 'vocabulary';

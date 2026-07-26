
# English Placement & Assessment System

A reusable assessment service future modules can consume. No AI, no payments, no lesson content. Local-only persistence via existing `AuthProvider` + localStorage (matches current architecture).

## Architecture

Four separated engines under `src/lib/assessment/`:

- `engine.ts` — session state machine: sections → questions → answers → completion.
- `scoring.ts` — per-skill percentages + overall score.
- `level.ts` — rule-based CEFR mapping (A1–C2) + confidence %.
- `recommend.ts` — maps weak skills to existing modules in `MODULES` registry.
- `questions/` — static question banks per section (vocabulary, grammar, reading, listening). Each item is typed; adding a section = adding a bank file + registering it.
- `types.ts` — `AssessmentSection`, `Question` (union of `multiple_choice` | `fill_blank` | `match` | `synonym` | `sentence_correction` | `true_false`), `Answer`, `SkillScore`, `AssessmentAttempt`, `AssessmentResult`.

Question banks are curated static data (10–12 items per implemented section, mixed difficulty). Speaking & Writing register as `coming_soon` sections with no bank.

## Data model (extends existing types)

Add to `src/lib/types.ts`:

- `SkillId = "vocabulary" | "grammar" | "reading" | "listening" | "speaking" | "writing"`
- `SkillScore { skill, correct, total, percentage }`
- `AssessmentAttempt { id, user_id, started_at, completed_at, duration_ms, answers: Answer[] }`
- `AssessmentResult { attempt_id, scores: SkillScore[], overall_percentage, estimated_level: EnglishLevel, confidence: number, strengths: SkillId[], weaknesses: SkillId[], recommended_module_ids: ModuleId[] }`

Extend `UserProfile` with `last_assessment?: AssessmentResult & { completed_at }`. Extend `AuthProvider` with `saveAssessment(result, attempt)`.

## Routes

- `src/routes/_app.assessment.tsx` — layout with `<Outlet />`.
- `src/routes/_app.assessment.index.tsx` — overview (what's tested, ~10–15 min, Start / Skip).
- `src/routes/_app.assessment.run.tsx` — section picker + active question flow.
- `src/routes/_app.assessment.results.tsx` — results dashboard, reads latest attempt.
- `src/routes/onboarding.tsx` — add optional "Take assessment" CTA at the summary step (links to `/assessment`, does not block completion).

## Components (`src/components/assessment/`)

- `AssessmentCard` — entry card (used on dashboard + profile).
- `SectionList` — six sections w/ status (available / coming soon / done).
- `QuestionCard` — renders any question type via a small switch (MC, fill-blank, match, synonym, true/false, sentence correction).
- `ProgressTracker` — question X of Y + section chip + optional timer.
- `AudioPlayer` — placeholder controls (play/pause/seek/replay); no real audio yet.
- `LevelBadge` — CEFR pill with color per level.
- `SkillScoreCard` — bar + %.
- `ResultSummary` — overall level + confidence.
- `RecommendationCard` — reuses existing pattern to suggest modules.

## Scoring & CEFR

- Per skill: `percentage = correct/total * 100`; weight harder questions higher (easy=1, medium=1.5, hard=2).
- Overall = weighted mean of implemented skills.
- CEFR bands: <25 A1, <40 A2, <60 B1, <75 B2, <90 C1, else C2.
- Confidence = min(100, 40 + total_questions_answered * 3), reduced if all skills weren't attempted.
- Strengths = skills ≥75%; weaknesses = skills <60%.
- Recommendation map: grammar→`grammar`, vocabulary→`vocabulary`, reading→`reading`, listening→`listening`.

## Dashboard & Profile integration

- Dashboard: new `AssessmentStatusCard` — if no attempt, "Take placement test" CTA; if attempt exists, show level badge, last date, "Retake" button.
- Profile page: same card in a smaller variant with a link to `/assessment`.

## Out of scope (per rules)

Real audio, AI grading, speaking/writing capture, payments, module content, backend persistence (localStorage only — matches current app).

## Deliverables at the end

Short recap covering: features shipped, data additions, components, scoring logic, CEFR method, integration points for future modules, and Prompt 6 suggestions.

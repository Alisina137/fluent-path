# Fluent Path Project State

## Objective
Modular AI-assisted English learning SaaS. Learners subscribe to individual learning modules and keep progress in one account.

## Stack
TanStack Start/Router, React 19, TypeScript, Vite 8, Tailwind CSS 4, Radix UI, Neon PostgreSQL, Drizzle ORM, Playwright.

## Completed phases
1. Foundation and architecture
2. Authentication and accounts
3. Onboarding and English profile
4. Dashboard, navigation and module system
5. Subscription/module access
6. AI Speaking Coach
7. AI Writing Coach
8. Vocabulary Builder

## Current phase
Phase 9 — Listening Lab is implemented on branch `phase-09-listening-lab` and awaiting local verification plus merge authorization.

Implemented outcome:
- CEFR A1-C2 listening lesson library with topic/level/search filters and pagination.
- Listening player with adjustable 0.75x, 1x, 1.25x and 1.5x playback.
- Recorded-audio URL support plus a no-cost browser English speech fallback for development content.
- Comprehension questions with server-side scoring and explanations.
- Dictation mode with normalized word-level edit-distance accuracy scoring.
- Shadowing mode with in-browser microphone recording and replay; raw microphone audio remains local to the browser.
- Persistent listening attempts and per-lesson progress.
- Progress summary for completed lessons, listening minutes, dictation average and shadowing sessions.
- Server-side authentication and Listening Lab entitlement enforcement.
- Marketplace and My Learning navigation integration.
- Listening Lab release status enabled in both the module registry and database migration.
- Starter listening catalog spanning A1-C2 and multiple topics.
- Playwright access coverage.

## Phase 9 data model
- `listening_lessons`
- `listening_questions`
- `listening_attempts`
- `user_listening_progress`

## Verification required before merge
Run from the phase branch:
- `npm ci`
- `npm run db:migrate`
- `npx tsc --noEmit`
- `npm run build`
- `npx playwright test tests/e2e/listening.spec.ts`

The database migration and runtime checks have not been executed by the GitHub connector and must not be treated as passed until run in a development environment.

## Content/audio note
The architecture supports production recorded/native audio through `audio_url`. The seeded Phase 9 development catalog intentionally uses the browser speech engine when no audio URL is present, avoiding a paid audio dependency. Production-quality human/native recordings remain a content-population step and do not require an application architecture change.

## Previous phase
Phase 8 — Vocabulary Builder was merged to `main` in commit `97f7ac6b803ac984eebb7ed0429eeada286ec343`.

## Next phase
Phase 10 — Reading Trainer.

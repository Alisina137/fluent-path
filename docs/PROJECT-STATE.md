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

## Current phase
Phase 8 — Vocabulary Builder. Implementation branch: `phase-08-vocabulary-builder`.

Implemented outcome:
- CEFR A1-C2 vocabulary catalog with topic filters and search.
- Native-language translations using the learner language setting.
- Personal learning list and due review queue.
- Persistent spaced-repetition state and immutable review history.
- Again/Hard/Good/Easy review workflow.
- Progress summary (due, mastered, total reviews).
- Server-side authentication and module-entitlement enforcement.
- Marketplace/My Learning navigation and module release integration.
- Database migration and starter multilingual catalog.
- Reproducible 20,000-word CEFR catalog preparation/import pipeline (A1 1,500; A2 2,500; B1 3,500; B2 4,000; C1 4,500; C2 4,000).
- Vocabulary data scripts load `.env.local` consistently with local application configuration.

## Known verification / setup
- Migration `0016_vocabulary_builder.sql` has been applied in the development environment.
- Vocabulary E2E suite: 2 tests passed in the user's working tree.
- Production Vite/TanStack/Nitro build passed in the user's working tree on 2026-09-19; only non-blocking chunk-size and Vite tsconfig-paths warnings were reported.
- Neon import reached 20,013 active entries, revealing 13 legacy starter rows outside the canonical 20,000-word catalog. Cleanup now deactivates legacy rows outside the canonical catalog while preserving all learner/review history through existing foreign-key references.
- Final Phase 8 verification requires rerunning import/count after this normalization fix and confirming the TypeScript check result.
- The generated 20,000-word JSON and download cache are intentionally ignored; the catalog is reproducible from the preparation script.
- Catalog CEFR/POS/frequency data is source-backed. Full learner-quality definitions, examples, topics, synonyms, and non-English translations remain enrichment work and must not be represented as verified source content.
- Phase 7 left non-blocking dev/test ECONNRESET logging noise and a Vite tsconfig-paths deprecation warning.

## Next phase
Phase 9 — Listening Lab, after Phase 8 migration and verification are complete.

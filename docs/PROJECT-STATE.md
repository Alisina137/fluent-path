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
Phase 8 — Vocabulary Builder is complete and verified on implementation branch `phase-08-vocabulary-builder`. PR #1 remains open and unmerged pending explicit merge authorization.

Implemented outcome:
- CEFR A1-C2 vocabulary catalog with server-side topic/level/search filtering and 30-word pagination across the full 20,000-word catalog.
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

## Verification / setup
- Migration `0016_vocabulary_builder.sql` applied in the development environment.
- Vocabulary E2E suite: 2 tests passed.
- TypeScript check: `npx tsc --noEmit` passed.
- Production Vite/TanStack/Nitro build passed on 2026-09-19; only non-blocking chunk-size and Vite tsconfig-paths warnings were reported.
- Neon vocabulary import normalized the active catalog to exactly 20,000 entries and preserved learner/review history by deactivating 13 legacy rows outside the canonical catalog.
- Exact CEFR distribution verified: A1 1,500; A2 2,500; B1 3,500; B2 4,000; C1 4,500; C2 4,000.
- Generated catalog JSON and download cache are intentionally ignored; the catalog is reproducible from the preparation script.
- Catalog CEFR/POS/frequency data is source-backed. Full learner-quality definitions, examples, topics, synonyms, and non-English translations are not source-verified for all 20,000 entries and remain content-enrichment work.
- Phase 7 left non-blocking dev/test ECONNRESET logging noise and a Vite tsconfig-paths deprecation warning.

## Latest delivery revision
Phase 8 pagination/search fix added after the original finalization revision; verification of this follow-up fix is pending in the local working tree.

## Next phase
Phase 9 — Listening Lab.

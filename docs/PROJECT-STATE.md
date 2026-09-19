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

## Known verification / setup
- Migration `0016_vocabulary_builder.sql` must be applied to the non-production database before runtime verification.
- GitHub connector can edit/review the repository but does not provide a local Node runtime, so typecheck/build/Playwright must run in CI or the user's working tree before Phase 8 is marked complete and verified.
- Phase 7 left non-blocking dev/test ECONNRESET logging noise and a Vite tsconfig-paths deprecation warning.

## Next phase
Phase 9 — Listening Lab, after Phase 8 migration and verification are complete.

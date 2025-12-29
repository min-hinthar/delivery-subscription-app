You are Codex working in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PR GOAL: Make customer flows feel production-grade by improving forms, validation, loading states,
errors, and confirmations across customer pages.

Hard constraints:
- Do not change DB schema.
- Do not add binary files.
- Keep pnpm lint/typecheck/build passing.
- Do not weaken auth guards or RLS.

Scope:
- src/app/(auth)/**
- src/app/(app)/**
- src/components/**
- src/lib/api/** (response helpers / zod schemas usage)
- minimal edits elsewhere only if required for UX.

Must implement:

1) Form validation + UX:
   - Use zod schemas already defined (or add missing ones) and surface field-level errors.
   - Disable submit buttons while pending.
   - Show inline helper text where needed.
   - Ensure keyboard accessibility.

2) Loading / error / empty states:
   - Skeletons or loading indicators for pages that fetch user/subscription/appointments.
   - Clear error messages (not raw stack traces).
   - Empty states for no subscription / no appointment / no route.

3) Success feedback:
   - Toast or alert confirmations for:
     - onboarding save
     - address save/geocode
     - appointment save
   - On success, guide user to next step (e.g., onboarding → schedule)

4) Resilience:
   - If Google geocode fails, show actionable message and allow retry/edit.
   - If subscription status is stale, prompt refresh (re-fetch) and show fallback.

5) Update docs:
   - Expand docs/QA_UX.md to include:
     - “error cases” (bad address, network fail, not subscribed)
     - “loading states” checks

Acceptance criteria:
- No form submits silently without feedback.
- All async actions show pending + success/error states.
- User can recover from common errors without getting stuck.
- pnpm lint/typecheck/build pass.

Now implement PR B.

You are Codex working in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PRIMARY QA STANDARD: docs/QA_UX.md (2025/2026). Implement improvements so the customer flow meets that spec.

PR GOAL (PR B): Make the customer flow feel production-grade by adding:
- strong form validation UX
- loading/pending states
- success confirmations
- recoverable error states
- accessibility + interactive-motion compliance

Hard constraints:
- Do not change DB schema in this PR.
- Do not weaken auth guards or RLS.
- Do not add binary files.
- Keep pnpm lint/typecheck/build passing.

Scope:
- src/app/(auth)/**
- src/app/(app)/**
- src/components/**
- src/lib/api/** (zod schemas + response helpers)
- src/lib/** (only as needed to support better UX)

Must implement (map to QA_UX sections 2, 3, 5.3–5.6, 6):

1) Form UX best practices (2025/2026):
   - Field-level validation errors (zod) shown at the field and summarized at top if multiple.
   - Submit buttons show loading (spinner) and are disabled while pending.
   - Prevent double-submit (dedupe).
   - Preserve input values on error (no wiping forms).
   - Keyboard accessibility: tab order, Enter submit, focus on first invalid field.

2) Onboarding improvements:
   - Step 1: profile (name, phone) w/ helpful hints
   - Step 2: address input + geocode validation
   - Geocode failure: show actionable error + allow retry/edit + do not block permanently

3) Scheduling UX improvements:
   - Appointment save: pending + success toast/alert
   - “window full” state: disable selection + suggest alternatives
   - “after cutoff” state: show locked message and server error displayed nicely if attempted

4) Tracking UX improvements:
   - No route yet: friendly empty state with expectations
   - Realtime failure (if applicable): show reconnecting banner and fallback messaging

5) Global UX utilities:
   - Add a consistent toast/alert system (shadcn Toaster pattern is fine)
   - Standardize error mapping (422 shows validation errors; 401/403 show auth/access messages)
   - Add lightweight skeleton components for common page shells

6) Docs:
   - Ensure docs/QA_UX.md edge cases can be performed with the current UI.
   - Update docs/QA_UX.md only if you add concrete, testable requirements.

Acceptance criteria:
- No form submits silently; every async action has pending + success/error feedback.
- Users can recover from geocode failure, subscription gating, cutoff lock.
- a11y basics: labels, focus management for modals, interactive motion respected.
- pnpm lint/typecheck/build pass.

Stop after completing PR B.

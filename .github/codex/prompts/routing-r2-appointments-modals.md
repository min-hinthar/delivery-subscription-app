You are Codex. Follow AGENTS.md, docs/NEXTJS16_ROUTING_STANDARDS.md, docs/ROUTING_BACKLOG.md, docs/QA_UX.md, and scripts/codex/ROUTING_PLAYBOOK.md.

Context: delivery appointments are stored in public.delivery_appointments:
- id (uuid pk)
- user_id
- week_of (date)
- delivery_window_id
- address_id (nullable)
- notes (nullable)
- status (default 'scheduled')
- unique (user_id, week_of)

PR GOAL (R2): Implement advanced App Router UX:
- Canonical appointment page: /appointment/[id]
- When navigated from /schedule, appointment opens as a MODAL overlay using:
  - parallel route @modal
  - intercepting route (..)appointment/[id]
- Deep link: directly visiting /appointment/[id] shows full page.
- Back button from modal returns to /schedule without losing schedule context.

Must do:
1) Add canonical route:
   - src/app/(app)/appointment/[id]/page.tsx
   - It must be auth-protected and only allow the owner to view/edit.
   - If appointment not found or not owned, use notFound() or redirect appropriately.

2) Add schedule modal overlay:
   - src/app/(app)/schedule/layout.tsx to render: {children} and {modal}
   - src/app/(app)/schedule/@modal/default.tsx returns null
   - src/app/(app)/schedule/@modal/(..)appointment/[id]/page.tsx renders the same UI as canonical page, but inside a modal (sheet/dialog) with proper focus handling + close/back behavior.

3) Editing behavior:
   - Use existing API route /api/delivery/appointment (do NOT add a new API route unless necessary).
   - Support editing notes and delivery_window_id and address_id (if allowed by current business rules).
   - Enforce cutoff rules server-side (if currently enforced); if edit is disallowed, show a friendly message.

4) UX requirements:
   - Pending state on save
   - Success feedback
   - Error states are actionable
   - Respects prefers-reduced-motion
   - No binary files

5) Add not-found handling:
   - If id is invalid UUID or row missing, show a friendly not-found page with CTA back to Schedule.

6) Run:
   - bash scripts/codex/verify.sh

Acceptance tests (manual steps to include in PR):
- Go to /schedule, click an appointment → opens modal
- Refresh while modal open → should still render (deep link behavior should work)
- Copy /appointment/[id] URL and open in new tab → full page view works
- Back button closes modal and returns to schedule
- Unauthorized user cannot access any appointment

Open PR branch: codex/routing-r2-appointments-modals

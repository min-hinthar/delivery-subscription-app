You are Codex working in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PRIMARY QA STANDARD: docs/QA_UX.md (2025/2026). Implement improvements so the customer flow meets that spec.

PR GOAL (PR A): Fix the CUSTOMER JOURNEY and information architecture so the “happy path”
Landing → Pricing → Subscribe → Onboarding → Schedule → Track is obvious, mobile-first, and has no dead ends.

Hard constraints:
- Do not change DB schema in this PR.
- Do not change core billing/scheduling business logic except small bug fixes that unblock UX.
- Do not add binary files (ico/png/jpg). Use SVG or code-generated icons only.
- Keep pnpm lint/typecheck/build passing.
- Respect a11y and prefers-reduced-motion.

Scope:
- src/app/(marketing)/**
- src/app/(auth)/**
- src/app/(app)/**
- src/components/layout/**
- src/components/navigation/** (create/modify)
- src/components/ui/** (shadcn)
- src/components/motion/** (framer-motion)

Must implement (map to QA_UX sections 5 & 6):

1) Consistent navigation + headers (mobile-first):
   - Public navbar: Logo, How it Works, Pricing, Login
   - Auth navbar: Account, Schedule, Track, Billing, Logout
   - Active route highlighting
   - Mobile menu (sheet/drawer), tap targets >= 44px
   - Consistent page header pattern: title + short description + primary CTA

2) Guided “next step” CTAs on every page:
   - Landing (/): Check coverage + View plans
   - Pricing: single plan card w/ bullets, prominent Subscribe CTA
   - After subscribe success: route user to onboarding or schedule (based on profile completeness)
   - Onboarding: step-based UI (Profile → Address → Done) with clear progress indicator
   - Account: status cards + quick links to Billing / Schedule / Track
   - Schedule: highlight next eligible week + clear Save CTA
   - Track: clear empty state if no route yet

3) Guardrails / state-based messaging (no dead ends):
   - If unauthenticated: protected pages redirect + login page shows friendly “please sign in”
   - If logged-in but no active subscription: show CTA to Pricing and disable schedule/track actions with explanation
   - If subscribed but no appointment: show CTA to Schedule
   - If appointment exists but no route yet: show friendly “tracking will appear once assigned”

4) UX polish requirements:
   - Avoid blank screens while data loads: show page-level skeleton shells (lightweight)
   - No layout overflow on mobile
   - Dark mode parity (contrast + borders + muted text)
   - Add basic “trust cues” on marketing/pricing (delivery windows, cutoff time, support contact)
   - Ensure no open redirects (only internal return paths)

5) Docs update:
   - Update docs/QA_UX.md ONLY if you improved the checklist or found missing requirements.
   - Otherwise, keep it unchanged and ensure UI aligns to it.

Acceptance criteria:
- Customer happy path is discoverable and usable on 390x844 viewport.
- Every customer page has an obvious next action and never traps the user.
- Protected routes redirect correctly and explain why.
- pnpm lint/typecheck/build pass.

Stop after completing PR A.

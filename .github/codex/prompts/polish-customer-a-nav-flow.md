You are Codex working in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PR GOAL: Polish the CUSTOMER FLOW (Landing → Pricing → Subscribe → Onboarding → Schedule → Track)
by improving navigation, page layout, and obvious next-step CTAs. This PR must not change core business logic.

Hard constraints:
- Do not change DB schema.
- Do not change Stripe/Supabase behavior except minor bugfixes that unblock UI.
- Do not add binary files (ico/png/jpg). Use SVG or code-generated icon only.
- Keep pnpm lint/typecheck/build passing.

Scope (edit only these areas unless necessary):
- src/app/(marketing)/**
- src/app/(auth)/**
- src/app/(app)/**
- src/components/layout/**
- src/components/navigation/** (create)
- src/components/motion/** (if needed)
- src/components/ui/** (shadcn usage is okay)

Must implement:

1) A consistent CUSTOMER NAVIGATION system:
   - Public navbar: Logo, How it Works, Pricing, Login
   - Authenticated navbar: Account, Schedule, Track, Billing, Logout
   - Make nav responsive (mobile menu)
   - Show active route styling
   - Add consistent page headers (title + short description)

2) A clear, guided CUSTOMER JOURNEY (every page has a “next action”):
   - Landing (/): prominent CTA to “Check coverage” and “View plans”
   - Pricing (/pricing): single plan card with bullets + “Subscribe” button
   - After subscribe completion: direct user to onboarding (or schedule if already onboarded)
   - Onboarding: step-based UI (Profile → Address → Done)
   - Account: show current status + quick links (“Manage billing”, “Schedule delivery”, “Track delivery”)
   - Schedule: highlight the next available week and best default window
   - Track: show what user can expect (if no active route yet)

3) Add “guardrails” messaging (no dead ends):
   - If NOT logged in: protected pages redirect and show friendly message on login page
   - If logged in but NO active subscription: show CTA to Pricing
   - If subscribed but NO appointment: show CTA to Schedule
   - If appointment set but NO route yet: show “We’ll update tracking when the driver is assigned”

4) UX polish standards:
   - Use shadcn components consistently (Card, Button, Input, Badge, Alert, Separator)
   - Provide sane empty states (friendly, actionable, not blank screens)
   - Improve copy tone: short, friendly, confident
   - Ensure dark mode looks good (contrast, borders, muted text)

5) Update docs:
   - Add/Update docs/QA_UX.md with a customer “happy path” checklist (step-by-step)

Acceptance criteria (must meet before finishing):
- A new user can clearly discover pricing and subscription CTA from landing.
- A subscribed user can find Schedule and Billing in 1 click.
- Every customer page has a clear next action (no dead ends).
- Mobile navbar works without layout breakage.
- pnpm lint, pnpm typecheck, pnpm build all pass.

Now implement PR A.

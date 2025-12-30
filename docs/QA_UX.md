# QA_UX — Customer Flow (Happy Path + Edge Cases) — 2025/2026

This document defines **customer experience** and **security** QA standards for a modern, mobile-first Next.js 16 app.
It is designed to be used:
- after each phase PR
- before releases
- for regression checks

> Principles: secure-by-default, fast-by-default, accessible-by-default, resilient-by-default.

---

## 0) Quality Gates (Must Pass Before Merge)

### Code/Build gates
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

### Runtime gates (dev)
- `pnpm dev` starts with no server crashes
- No import-time env crashes (missing env vars should show friendly server errors only when invoked)

---

## 1) Supported Devices & Responsive Targets

### Viewports to verify (minimum)
- Mobile: 360×800 (Android), 390×844 (iPhone), 414×896
- Tablet: 768×1024
- Desktop: 1440×900

### Interaction models
- Touch: tap targets ≥ 44px, no hover-only affordances
- Keyboard: full navigation without mouse
- Screen readers: basic flows readable and operable

### Network conditions (minimum)
- Fast (Wi-Fi)
- Slow (Regular 3G simulation)
- Offline transitions:
  - ensure user sees a clear offline message and can retry

---

## 2) Performance & Perceived Speed (Customer-facing)

### Targets (practical)
- Pages show meaningful content quickly:
  - initial skeleton/header in < 1s on fast network
  - no “blank screen” while fetching
- Avoid layout jumps:
  - use skeletons/placeholder heights for cards/tables
- Ensure Maps loads only where needed:
  - maps bundle should not impact `/` and `/pricing` significantly

### Perceived speed checklist
- [ ] Every async action has a pending state (spinner / loading button)
- [ ] Lists show skeletons while loading (not empty)
- [ ] After success, user sees confirmation and the next step CTA
- [ ] Errors are human-readable, actionable, and retryable

---

## 3) Accessibility & UX Fundamentals

### Global a11y requirements
- [ ] Every input has a visible label (or aria-label)
- [ ] Form errors are announced and associated with fields
- [ ] Focus management:
  - modal opens: focus moved inside
  - modal closes: focus returns to triggering element
- [ ] Tab order is logical
- [ ] Color contrast is readable in both light and dark modes

### Motion accessibility
- [ ] Respects reduced motion (`prefers-reduced-motion`)
- [ ] Motion never blocks interaction (no forced waits)
- [ ] Animation durations are short and consistent (e.g., 150–250ms)

---

## 4) Security QA (Customer Flow)

> Supabase RLS is non-negotiable. All user data access must be ownership-checked server-side and in RLS policies.

### Auth & session
- [ ] Unauthenticated users cannot access protected pages (`/account`, `/schedule`, `/track`)
- [ ] Redirect after login is safe:
  - no open-redirect vulnerability (only allow internal paths)
- [ ] Session cookies are not exposed client-side
- [ ] Logout clears session and returns to public route

### Data access / IDOR (Insecure Direct Object Reference)
- [ ] User cannot load another user’s:
  - profile
  - address
  - appointment
  - order
  - route/stop details (unless intentionally public for tracking and scoped safely)

### Stripe security
- [ ] Webhook verifies Stripe signature (required)
- [ ] Webhook is idempotent (upsert keyed by Stripe IDs)
- [ ] Client cannot submit Stripe IDs to spoof subscription state

### Maps security
- [ ] Google Maps API key used server-side for geocoding/directions
- [ ] Client never gets unrestricted server key
- [ ] Requests validated and rate-limited (at least basic throttling)

### CSP & security headers (recommended)
- [ ] CSP configured to reduce XSS risk (scripts/images/fonts origins explicit) :contentReference[oaicite:1]{index=1}
- [ ] Clickjacking protections (frame-ancestors/ X-Frame-Options)
- [ ] Avoid inline script unless nonce-based

---

## 5) Customer Happy Path (Step-by-step)

This is the “golden flow” that must work smoothly on mobile and desktop.

### 5.1 Landing → Pricing
1) Visit `/`
- Expected:
  - clear headline: weekly delivery subscription
  - CTA buttons: **Check Coverage** and **View Plans**
  - no auth required
  - coverage checker:
    - accepts ZIP code input
    - shows eligible/ineligible response with reason
    - when eligible, shows ETA/distance values
  - weekly menu section:
    - shows published menu items for current week
    - empty state message when menu not published

2) Tap “View Plans” → `/pricing`
- Expected:
  - plan card with bullets and price
  - “Subscribe” CTA above the fold (mobile)
  - if already logged in + subscribed, show “Manage billing” and “Schedule delivery” CTAs

Checklist:
- [ ] No layout overflow on mobile
- [ ] CTA visible without scrolling excessively
- [ ] Clear trust cues (delivery area, times, support)

### 5.2 Subscribe (Stripe Checkout)
3) Tap “Subscribe”
- Expected:
  - loading state on button
  - checkout session created server-side
  - redirect to Stripe Checkout

4) Complete checkout (test mode)
- Expected:
  - return to app success route
  - app reflects subscription status after webhook sync (may take a few seconds)
  - show “Next step: onboarding/schedule”

Checklist:
- [ ] Failure states are clear (card declined → show retry)
- [ ] Canceling checkout returns user safely to pricing with a message

### 5.3 Onboarding (Profile → Address)
5) Onboarding page
- Expected:
  - step-based UX:
    - Step 1: name + phone
    - Step 2: address + validation
    - Done: confirmation + CTA to schedule

Address requirements:
- [ ] Address input validates format
- [ ] Geocode:
  - success → store formatted address + lat/lng
  - failure → show reason + allow editing + retry

Checklist:
- [ ] Inline errors (zod) show on submit and on blur (as designed)
- [ ] “Save” button disabled while pending
- [ ] Success toast/alert appears

### 5.4 Schedule Appointment
6) Visit `/schedule`
- Expected:
  - shows next eligible `week_of`
  - shows delivery windows (Sat 11–7, Sun 11–3)
  - user can select time window and save

Cutoff behavior:
- [ ] If within cutoff window (after Friday 5pm PT), the UI shows “Locked for this weekend”
- [ ] Server enforces cutoff; UI does not rely on client clock only

Checklist:
- [ ] On save: pending state + success confirmation
- [ ] If window full: user sees “Full” with alternative suggestion
- [ ] If not subscribed: show CTA back to pricing (no confusing errors)

### 5.5 Track Delivery
7) Visit `/track`
- Expected:
  - If no route assigned yet:
    - show friendly message: “We’ll update tracking when the driver is assigned”
  - If route/stops exist:
    - show current stop status + ETA where available
    - map loads smoothly; doesn’t block basic info
    - realtime updates reflect status changes

Checklist:
- [ ] Track works on mobile (map doesn’t overflow)
- [ ] Updates are readable (status badges, timestamps)
- [ ] No sensitive data leaked (e.g., other customers’ full addresses)

### 5.6 Account & Billing
8) Visit `/account`
- Expected:
  - show subscription status
  - show primary address
  - show appointment summary for upcoming week
  - CTA: “Manage billing”, “Edit address”, “Schedule delivery”

9) Tap “Manage billing”
- Expected:
  - loading state
  - redirect to Stripe Billing Portal
  - return to app safely

Checklist:
- [ ] Portal cannot be opened without auth
- [ ] Subscription state shown matches Stripe (eventual consistency allowed)

---

## 6) Edge Cases (Customer)

### Auth & routing
- [ ] Open `/account` logged out → redirected to `/login` with a friendly banner
- [ ] Magic link login:
  - success → returns to last intended route
  - failure/expired → clear message and resend option
- [ ] Invalid login credentials or unknown account → show “No active account found or credentials are incorrect. Please sign up.”

### Subscription states
- [ ] subscription = `past_due`:
  - show banner: “Payment issue—update payment method”
  - CTA: Billing portal
- [ ] subscription = `canceled`:
  - show “Resubscribe” CTA
  - scheduling disabled
- [ ] subscription paused:
  - show paused reason + “Resume in billing portal”

### Address / coverage
- [ ] Invalid address (geocode fails) → user can retry/edit, not stuck
- [ ] Out-of-coverage ZIP:
  - show explanation and alternatives (pickup / waitlist)
  - do not allow subscription if policy requires coverage first (if that’s your rule)

### Schedule constraints
- [ ] Window full → show alternate windows
- [ ] After cutoff (Friday 5pm PT) user attempts changes:
  - UI blocks with explanation
  - server rejects with 403/422 and UI shows message

### Tracking
- [ ] No driver assigned → friendly “not live yet”
- [ ] Route exists but stop missing → show “We’re finalizing your route”
- [ ] Realtime disconnect → show “Reconnecting…” and fallback polling (optional)

### Reliability failures
- [ ] Maps API failure:
  - show textual info without map
  - allow retry
- [ ] Stripe webhook delay:
  - show “Finalizing subscription…” and a refresh action

---

## 7) Motion / Animation QA (Framer Motion)

### Page transitions
- [ ] consistent enter/exit animation (no flicker)
- [ ] respects reduced motion (disable or shorten)
- [ ] no scroll position bugs on navigation

### Modals/Sheets
- [ ] open/close is smooth
- [ ] focus trap works
- [ ] close on Escape
- [ ] backdrop click closes (if appropriate)

### Lists
- [ ] scheduling options reorder/animate without jumping
- [ ] status updates animate subtly (no “bouncing”)

---

## 8) Theming QA (Dark/Light)

- [ ] All text readable in both themes
- [ ] Inputs, borders, cards consistent
- [ ] Focus rings visible in both themes
- [ ] Theme switch animates smoothly and does not cause layout shift

---

## 9) Privacy & Data Minimization

- [ ] Avoid logging PII (address, phone) in server logs
- [ ] Client UI shows minimal necessary address info (mask if needed)
- [ ] Do not expose internal IDs in URLs if avoidable

---

## 10) Vercel Cron / Weekly Generation (Customer-impact QA)

If using Vercel Cron Jobs:
- [ ] Cron configured via `vercel.json` and points to an existing path :contentReference[oaicite:2]{index=2}
- [ ] Cron endpoint requires `CRON_SECRET`
- [ ] Cron is safe to run multiple times (idempotent weekly order generation)
- [ ] Customer sees correct upcoming order/appointment after cron

> Note: Cron schedule is in UTC; compute PT cutoff server-side to handle DST correctly. :contentReference[oaicite:3]{index=3}

---

## 11) Automated Regression (Recommended for 2025/2026)

### Suggested tooling
- Playwright: end-to-end customer happy path
- Lighthouse CI: performance regression guard
- axe-core: accessibility smoke checks

Minimum automated tests:
1) Landing → Pricing loads
2) Auth (signup/login) basic flow
3) “Guarded route redirects” work
4) Schedule save action shows success
5) Track page loads (with mock empty state)

---

## 12) Release Checklist (Customer)

- [ ] Happy path works on mobile + desktop
- [ ] No dead ends; every page has next step CTA
- [ ] All forms have validation + pending + success/error feedback
- [ ] Subscription gating is clear and correct
- [ ] Cutoff logic enforced server-side
- [ ] No binary files introduced in Codex Web PRs
- [ ] Security headers / CSP reviewed (especially if adding external scripts) :contentReference[oaicite:4]{index=4}
- [ ] If using request interception, follow Next.js 16 `proxy.ts` convention (avoid middleware pitfalls) :contentReference[oaicite:5]{index=5}

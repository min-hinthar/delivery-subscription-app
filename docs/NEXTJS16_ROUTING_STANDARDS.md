# Next.js 16 App Router — Routing Standards (2025/2026)

This document defines routing conventions for our Next.js 16 App Router app.

Primary goals:
- predictable, scalable route organization
- strict security boundaries (customer vs admin)
- modern UX patterns (modals with deep links, composable shells)
- correct caching for public vs private data
- maintainable error/loading boundaries

Sources:
- Next.js App Router docs (layouts/pages, parallel routes, intercepting routes, route handlers) :contentReference[oaicite:1]{index=1}
- Curbanii advanced patterns overview :contentReference[oaicite:2]{index=2}

---

## 0) Golden Rules
1) **Authz is server-enforced at layout/route handler level**, never only client-side.
2) **Private customer data is `no-store`** by default (pages + APIs).
3) **Parallel + intercepting routes** are allowed for UX (modals/side panels) only if they do not weaken auth.
4) **Prefer server control flow**: use `redirect()` / `notFound()` in server components. :contentReference[oaicite:3]{index=3}
5) Every segment has a deliberate **loading/error/not-found** story. :contentReference[oaicite:4]{index=4}
6) **Layouts that call Supabase server helpers must guard missing env vars** and render a friendly config message before invoking `createSupabaseServerClient` to avoid compile/runtime crashes in dev/verify environments.

---

## 1) Route Groups (Layout Boundaries)
We use route groups to separate concerns without changing URLs: :contentReference[oaicite:5]{index=5}

- `(marketing)` — public pages (home, coverage check, pricing, FAQ)
- `(auth)` — login/signup/magic link callback
- `(app)` — authenticated customer experience
- `(admin)` — admin-only experience

Required layouts:
- `src/app/(marketing)/layout.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(admin)/layout.tsx`

Each group must define:
- `loading.tsx`
- `error.tsx` (client component, friendly retry)
- `not-found.tsx` where relevant

---

## 2) Composable Shells with Parallel Routes (Slots)
Parallel routes are recommended for dashboards with persistent navigation/sidebars and optional panels. :contentReference[oaicite:6]{index=6}

### Allowed slots
- `@nav` — persistent navigation (customer/admin)
- `@content` — main content area (can replace children entirely)
- `@modal` — modal overlays (paired with intercepting routes)
- `@panel` — secondary panel (e.g., route preview/map)

Example folder shape:
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/@nav/page.tsx`
- `src/app/(admin)/admin/@content/page.tsx`
- `src/app/(admin)/admin/@modal/default.tsx` (empty default)

We allow **slot-only layouts** where `children` is omitted and the shell is entirely slot-driven. :contentReference[oaicite:7]{index=7}

---

## 3) Modals with Deep Links using Intercepting Routes
Use intercepting routes + a `@modal` parallel slot to open details as overlays while preserving list state. :contentReference[oaicite:8]{index=8}

### Customer examples (recommended)
- From `/schedule` list → open appointment details/edit as modal:
  - Canonical page: `/appointment/[id]`
  - Intercepted modal from schedule:
    - `src/app/(app)/schedule/@modal/(..)appointment/[id]/page.tsx`
  - Schedule page renders `{modal}` slot.

### Admin examples (recommended)
- From `/admin/deliveries` list → open stop detail modal:
  - Canonical page: `/admin/stops/[id]` (or `/stops/[id]` under admin group)
  - Intercepted modal from deliveries:
    - `src/app/(admin)/admin/deliveries/@modal/(..)stops/[id]/page.tsx`

Requirements:
- Modal route must be shareable (canonical URL works directly)
- Back button closes modal (not navigate away unexpectedly)
- Auth/admin gating still applies to modal routes

---

## 4) Smart Optional Catch-All + Proper 404s
Use optional catch-all `[[...slug]]` where content is hierarchical but unknown at build time, and call `notFound()` when the slug is invalid. :contentReference[oaicite:9]{index=9}

Recommended for:
- `/help/[[...slug]]` (customer help docs)
- `/legal/[[...slug]]` (terms/privacy versions)

---

## 5) Segment-Level Loading + Error Boundaries
Every major segment should define:
- `loading.tsx` for skeletons
- `error.tsx` for recoverable errors with `reset()` :contentReference[oaicite:10]{index=10}

Guideline:
- Prefer small `loading.tsx` at segment roots to visualize boundaries early.
- Errors bubble until a boundary catches them; place boundaries where user can meaningfully retry.

---

## 6) Route Handlers & Caching Rules
Route handlers follow `app/api/**/route.ts`.

- Validate inputs (zod) in every handler.
- Private endpoints: return `Cache-Control: no-store`.
- Public endpoints: may opt into caching (e.g., coverage ZIP check).
- Route handlers are not cached by default, but GET can opt into caching. :contentReference[oaicite:11]{index=11}

Pattern (public GET caching / edge-friendly):
- `s-maxage=60, stale-while-revalidate=300` for safe public data
Pattern (private):
- `no-store` always

---

## 7) Partial Prebuild with generateStaticParams (Marketing Only)
If we introduce marketing/blog/help slugs, we can prebuild “hot paths” and keep the rest dynamic. :contentReference[oaicite:12]{index=12}

Not recommended for authenticated pages.

---

## 8) Locale-Aware Routing (Optional)
If we support Burmese + English without changing URLs, we may use middleware to set locale header/cookie, then wrap a locale provider in a route group. :contentReference[oaicite:13]{index=13}

This is optional and should be implemented only when i18n is prioritized.

---

## 9) Robust redirect() / notFound() Control Flow
Prefer server-driven control in server components:
- `notFound()` for invalid IDs/slugs
- `redirect()` for gating flows (e.g., onboarding incomplete) :contentReference[oaicite:14]{index=14}

---

## 10) Standard URL Map
Customer:
- `/` `/pricing` `/coverage` `/login` `/signup`
- `/onboarding`
- `/account`
- `/schedule`
- `/track`
- `/appointment/[id]` (canonical detail page)
Admin:
- `/admin/deliveries`
- `/admin/routes`
- `/admin/meals`
- `/admin/subscriptions`
- `/admin/stops/[id]` (canonical stop detail)

## 11) Acceptance Checklist
- [ ] Route groups exist and layouts are correct
- [ ] Auth/admin gating enforced server-side at group layout
- [ ] Modal overlays work via intercepting routes (deep link + back closes modal)
- [ ] loading/error boundaries exist for major segments
- [ ] Private data is no-store; public data caching is intentional
- [ ] No broken URLs; changes include redirects + docs

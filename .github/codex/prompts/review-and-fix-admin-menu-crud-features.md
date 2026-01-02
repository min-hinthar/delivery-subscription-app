# Codex Review & Fix Prompt — Admin Menu CRUD (Frontend + Backend)

## Mission
Review the recently implemented **admin menu CRUD** feature and fix any issues so the **frontend and backend work flawlessly**. Follow repo docs as source of truth.

## Primary Specs (must follow)
- `docs/BLUEPRINT.md`
- `docs/QA_UX.md`
- `docs/SECURITY_QA.md`
- `docs/NEXTJS16_ROUTING_STANDARDS.md`
- `docs/CODEX_ADMIN_MENU_SPEC.md`
- `docs/SECURITY_OVERVIEW.md`, `docs/SECURITY_CHECKLIST.md`, `docs/RLS_AUDIT.md`, `docs/WEBHOOK_SECURITY.md`, `docs/HEADERS_AND_CSP.md`
- `docs/CHANGE_POLICY.md`, `docs/CODEX_DEVEX.md`

## Non‑negotiable rules
- **Do not weaken** authz, RLS, admin gating, or webhook verification.
- **No secrets** in commits. Never edit `.env.local` or real keys.
- **No binary files** (png/jpg/etc).
- **Scope discipline**: touch only files required to fix issues.
- **Use Next.js App Router standards** from `docs/NEXTJS16_ROUTING_STANDARDS.md`.
- **Private data = no-store** (pages + APIs).

## Required start routine
1. `bash scripts/codex/git-sync-main.sh` (if available)
2. Create a new branch (per naming rules in `AGENTS.md`).

## Required completion routine
1. Run `bash scripts/codex/verify.sh`.
2. If routing changed, run `bash scripts/codex/verify-routing.sh`.
3. Prepare a PR description with:
   - Summary of changes
   - How to test (commands + click path)
   - QA_UX + Security considerations
   - Risks/rollback notes

---

# Review Checklist (find issues, then fix)

## 1) Routing + Auth/Admin Gating
- Admin pages must live under `(admin)` route group.
- Admin enforcement **server-side** in `(admin)/layout.tsx` using `profiles.is_admin`.
- `/admin/login` **must not** be under admin-gated layout (avoid redirect loops).
- Ensure route boundaries per `docs/NEXTJS16_ROUTING_STANDARDS.md`.

## 2) API Routes (`src/app/api/**/route.ts`)
- All mutating routes validate input with **zod**.
- Return JSON in the canonical shape:
  - `{ ok: true, data: ... }`
  - `{ ok: false, error: { code, message, details? } }`
- Use **no-store** headers for private endpoints.
- Avoid PII logging (no full addresses/phones, no Stripe raw payloads).
- Map common errors to friendly messages (401/403/422/429/500).
- Prevent open redirects (only internal return paths).

## 3) Supabase + RLS
- CRUD tables must have RLS policies in `supabase/migrations/*`.
- Ensure no IDOR (users/admins can access only permitted rows).
- Service role key only for server-only operations.

## 4) Frontend UX / UI
- No blank states. Provide loading, error, and empty states as needed.
- Ensure a clear CTA on each page (`docs/QA_UX.md`).
- Mobile tap targets ≥ 44px.
- Dark mode parity.
- `"use client"` only for interactive leaf components.
- Keep framer motion subtle; respect `prefers-reduced-motion`.

## 5) Security & Privacy
- No user enumeration in auth flows.
- No leakage of stack traces/secrets/PII.
- Confirm security QA coverage per `docs/SECURITY_QA.md`.

---

# Execution Plan (do this in order)

## Step A — Locate admin CRUD changes
- Use `git status`, `git diff`, and `rg` to find admin menu CRUD files.
- Identify related routes, API handlers, UI components, and Supabase migrations.

## Step B — Validate + fix
- Run through the review checklist above.
- For each issue found:
  - Fix with minimal scope.
  - Update docs if required by `AGENTS.md`:
    - UX changes → `docs/QA_UX.md` / `docs/UI_POLISH_REPORT.md`
    - Security changes → `docs/SECURITY_CHECKLIST.md` / `docs/SECURITY_REPORT.md`
    - Routing changes → `docs/NEXTJS16_ROUTING_STANDARDS.md` / `docs/CURRENT_APP_TREE.md`
    - DevEx changes → `docs/CODEX_DEVEX.md`

## Step C — Verify
- `bash scripts/codex/verify.sh`
- `bash scripts/codex/verify-routing.sh` (if routing changed)

## Step D — Wrap up
- Summarize fixes and testing.
- Ensure PR body includes: summary, how to test, QA_UX/Security considerations, risks/rollback.

---

# Output Expectations
- Provide a concise summary of issues found and fixes applied.
- List tests/commands executed.
- If blocked by missing info or credentials, document the blocker and what’s needed.

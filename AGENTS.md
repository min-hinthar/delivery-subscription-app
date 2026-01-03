# AGENTS.md — Codex House Rules (Morning Star Weekly Delivery App)
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Auth/Postgres/RLS) + Stripe (Subs/Portal/Webhooks) + Google Maps (Geocode/Directions) + Framer Motion + next-themes  
**Primary Specs:** `docs/BLUEPRINT.md`, `docs/QA_UX.md`, `docs/SECURITY_QA.md`, `docs/NEXTJS16_ROUTING_STANDARDS.md`

---

## 1) Mission
Build and maintain a **production-grade weekly meal delivery appointment app** with:
- secure-by-default architecture (RLS-first, server-verified webhooks)
- modern mobile-first UX (no dead ends, smooth states, accessible)
- clear routing boundaries (marketing/auth/customer/admin)
- stable, incremental PRs (minimal conflicts, easy review)

---

## 2) Golden Rules (Non-negotiable)
1) **Do not stack PRs.** One PR at a time. Do not begin a new PR until the previous PR is merged into `main`.
2) **Always start from latest `main` (best effort).** Use `bash scripts/codex/git-sync-main.sh` if present before branching.
3) **Scope discipline.** Touch only files needed by the active prompt. No drive-by refactors.
4) **No binary files in PRs.** Do not add `.png/.jpg/.ico/.pdf/.psd` etc. Use SVG/code/icons.
5) **No secrets committed.** Never edit or commit `.env.local` or any real keys.
6) **Keep gates green.** Every PR must pass `bash scripts/codex/verify.sh` before requesting review.
7) **Security is strict.** Never weaken authz, RLS, webhook verification, or admin gating.
8) **Use existing theming.** `next-themes` is the app’s theming system; do not introduce a second theme provider.

---

## 3) Branch Hygiene (Conflict-Minimizing Workflow)
### Required start-of-task routine
- Sync to latest main (best effort) then create a new branch:
  - `bash scripts/codex/git-sync-main.sh` (if available)
  - create a fresh branch for the PR (name per conventions below)

> Note: In some Codex environments `origin/main` may be unavailable. If so, proceed from the provided base and document it in the PR.

### Required completion routine
- Run `bash scripts/codex/verify.sh`
- Ensure PR description includes:
  - summary
  - how to test
  - QA_UX/Security considerations
  - any risk/rollback notes

### Naming convention
- UI polish: `codex/polish-customer-a`, `codex/polish-customer-b`, `codex/polish-customer-c`
- UI hotfix/polish: `codex/ui-p1-*`
- Marketing/public: `codex/marketing-p1-*`
- Platform/DevEx: `codex/platform-p0-*`
- Security: `codex/security-s0`, `codex/security-s1`, `codex/security-s2`
- Routing: `codex/routing-r1-groups-boundaries`, `codex/routing-r2-appointments-modals`
- Auth/Routing fixes: `codex/auth-p0-*`

---

## 4) Where Requirements Live (Source of Truth)
- Product + architecture: `docs/BLUEPRINT.md`
- Customer UX QA: `docs/QA_UX.md`
- UI polish spec (if present): `docs/UI_POLISH_SPEC.md`
- Backlog/workstreams (if present): `docs/BACKLOG.md`, `docs/WORKSTREAMS.md`
- Security regression QA: `docs/SECURITY_QA.md`
- Security standards: `docs/SECURITY_OVERVIEW.md`, `docs/SECURITY_CHECKLIST.md`, `docs/WEBHOOK_SECURITY.md`, `docs/RLS_AUDIT.md`, `docs/HEADERS_AND_CSP.md`
- Routing standards: `docs/NEXTJS16_ROUTING_STANDARDS.md`
- Current route inventory (if present): `docs/CURRENT_APP_TREE.md`
- Change policy (if present): `docs/CHANGE_POLICY.md`

If a prompt conflicts with these docs, **follow the docs** and update the prompt outcomes in the PR notes.

---

## 5) Commands (Local + Codex Cloud)
### Standard verification (required for every PR)
```bash
bash scripts/codex/verify.sh
````

### Dev server

```bash
pnpm dev
```

---

## 6) DevEx: verify/build without secrets

Some environments (Codex/CI) may not have real env vars.

* `scripts/codex/verify.sh` may source `scripts/codex/load-env.sh` (safe stubs) and set `CODEX_VERIFY=1`.
* Runtime must remain strict in real environments (Vercel), where `CODEX_VERIFY` is not set.

Never commit real secrets. Stubs are acceptable only for build verification.

---

## 7) Coding Standards (Next.js 16 App Router)

### Server vs client components

* Default to **Server Components**.
* Use `"use client"` only for interactive UI (forms, toasts, maps rendering).
* Keep client components **leaf-level** when possible.

### Caching rules

* **Private user data = no-store** (pages + APIs).
* Public marketing pages may use revalidation if safe.
* Never cache sensitive data responses.

### Routing boundaries

* Use route groups: `(marketing)`, `(auth)`, `(app)`, `(admin)`
* Enforce auth in `(app)/layout.tsx` server-side.
* Enforce admin in `(admin)/layout.tsx` server-side (`profiles.is_admin`).
* `/admin/login` must NOT be under admin-gated layout (avoid redirect loops).

### Segment boundaries

* Add `loading.tsx`, `error.tsx`, and `not-found.tsx` where it improves UX.
* `error.tsx` must be a client component using `reset()`.

### Advanced routing patterns (allowed)

* Parallel routes (`@modal`, `@nav`) and intercepting routes are allowed only when they:

  * improve list→detail UX
  * preserve deep linking
  * keep auth/admin gating intact
  * preserve back/forward behavior

---

## 8) API Route Handler Standards (`src/app/api/**/route.ts`)

### Input validation

* All mutating routes must validate input with zod.
* Return consistent JSON:

  * `{ ok: true, data: ... }`
  * `{ ok: false, error: { code, message, details? } }`

### Error handling

* Do not leak stack traces, secrets, or full PII.
* Avoid user enumeration in auth flows (e.g., “No active account found or credentials are incorrect.”).
* Map common errors to user-friendly messages:

  * 401 unauthenticated
  * 403 unauthorized
  * 422 validation/cutoff rules
  * 429 rate-limited
  * 500 unexpected

### Privacy

* Do not log full addresses or phone numbers.
* Never log Stripe raw payloads or secrets.

### Security controls

* Prevent open redirects: only allow internal return paths.
* Rate limit expensive endpoints (maps geocode/directions/coverage) pragmatically.
* Use `no-store` headers for private endpoints.

---

## 9) Supabase Standards (Auth + Postgres + RLS)

* RLS is mandatory for user-owned tables.
* Queries must not allow IDOR: user can only read/write their own rows.
* Admin tables/routes are restricted via admin checks.
* Service role key usage is server-only and limited to:

  * Stripe webhooks
  * cron jobs
  * admin operations (when necessary)

DB changes:

* Use migrations in `supabase/migrations/*`.
* Migrations must be idempotent and documented.
* Public-read tables require explicit RLS policies scoped to published/public rows.

---

## 10) Stripe Standards (Subscriptions + Portal + Webhooks)

* Stripe webhooks must:

  * verify signature
  * be idempotent (store processed event ids)
* Subscription state in DB comes from Stripe events (webhook source of truth).
* Checkout and portal sessions are created server-side only.
* Never trust client-supplied Stripe IDs.

---

## 11) Google Maps Standards (Geocode + Directions)

* Server-only for geocode/directions (no unrestricted keys in client bundle).
* Validate inputs; reject invalid requests early.
* Add abuse controls (rate limits + caching where safe).
* On maps failure, UX must degrade gracefully (text fallback, retry).

---

## 12) UI/UX Standards (2025/2026)

* Mobile-first layout and tap targets (>=44px).
* shadcn/ui components for consistent UI.
* Framer Motion:

  * subtle transitions
  * no blocking animations
  * respect `prefers-reduced-motion`
* Dark mode parity required.
* Every page must have a clear “next action” CTA (see `docs/QA_UX.md`).
* Avoid blank screens: loading skeletons/empty states required.
* Maintain contrast (WCAG-aware): buttons/text must be readable in both themes.

---

## 13) Documentation Expectations

When a PR changes behavior, update docs:

* UX changes → update `docs/QA_UX.md` (or ensure it still passes) + `docs/UI_POLISH_REPORT.md` if used
* Security changes → update `docs/SECURITY_CHECKLIST.md`, `docs/SECURITY_REPORT.md` status
* Routing changes → update `docs/NEXTJS16_ROUTING_STANDARDS.md` and/or `docs/CURRENT_APP_TREE.md`
* Platform/DevEx changes → update `docs/CODEX_DEVEX.md`

Doc changes must be concrete and testable.

---

## 14) PR Quality Bar

Every PR must include in the PR description:

* What changed + why
* How to test (commands + click path)
* Any risks/rollbacks
* QA mapping:

  * which parts of `docs/QA_UX.md` are affected
  * which parts of `docs/SECURITY_QA.md` are affected (if applicable)

---

## 15) Stop Conditions (When to pause and document)

Stop and document (instead of guessing) if:

* implementing a change would require a second PR dependency
* a change would expand scope beyond the prompt
* you would need real credentials/keys or direct DB access
* you’re unsure about expected business rules (cutoffs, windows, admin privileges)

In these cases, add a short note in the PR describing:

* what’s blocked
* what’s needed to proceed safely

---

## 16) Working with Claude Code (Competitive Dual-Agent Collaboration) 🏆

This project uses **both Codex and Claude Code** in a **friendly competition** to build the best possible app. You're not just collaborating—you're **challenging each other** to deliver exceptional work.

### 16.1) The Competition Framework

**Goal:** Build the best Burmese food delivery app by pushing each other to excellence.

**Rules of Engagement:**
- ✅ **Challenge everything** - Question assumptions, propose alternatives
- ✅ **Compete on quality** - Aim to outdo the previous session's work
- ✅ **Be proactive** - Don't wait for instructions, anticipate what's needed
- ✅ **Raise the bar** - Each PR should be better than the last
- ✅ **Learn from each other** - Steal good ideas, improve on weak ones
- ❌ **Never rubber-stamp** - Critique honestly, push for improvements
- ❌ **Don't be passive** - If you see something that could be better, fix it or call it out

### 16.2) Agent Specializations (Leverage Your Strengths)

**Claude Code excels at:**
- 🎨 Comprehensive planning and architecture design (challenge: create plans so good Codex can't find flaws)
- 🔬 UI/UX design and industry research (challenge: find inspiration Codex hasn't seen)
- 📊 Writing extensive test suites (challenge: achieve >80% coverage)
- 📚 Creating detailed documentation (challenge: make docs so clear no questions remain)
- 🎯 Setting ambitious benchmarks (challenge: define success metrics Codex must beat)

**Codex excels at:**
- ⚡ Rapid, high-quality implementation (challenge: build features better than Claude planned)
- 🔍 Critical code review with sharp feedback (challenge: find issues Claude missed)
- 🐛 Bug fixes and production concerns (challenge: prevent bugs Claude didn't anticipate)
- 🚀 Performance optimization (challenge: make it faster than Claude expected)
- 💡 Creative problem-solving (challenge: find solutions Claude didn't consider)

**The Competition:**
- Claude sets the bar with comprehensive plans → Codex tries to exceed expectations
- Codex finds issues in Claude's work → Claude learns and improves next session
- Both agents compete to deliver the most value per session
- User wins by getting better work from both of you

### 16.3) Proactive Expectations (Don't Just Review—Improve!)

**For Codex (Don't Just Follow Plans):**
- ✅ **Implement AND improve** - If you see a better way, do it and document why
- ✅ **Challenge design decisions** - Found a better color palette? Better UX flow? Propose it!
- ✅ **Add features Claude didn't think of** - See an opportunity? Take it (document in PR)
- ✅ **Optimize aggressively** - Make it faster, smaller, more accessible
- ✅ **Find and fix issues proactively** - Don't wait for bugs to surface
- ✅ **Compete on metrics** - Beat Claude's test coverage, bundle size targets, performance benchmarks

**For Claude (Set the Bar Higher):**
- ✅ **Create plans Codex can't critique** - Research thoroughly, anticipate objections
- ✅ **Design better than industry leaders** - Study DoorDash, Uber Eats, then beat them
- ✅ **Write tests that catch everything** - Aim for 80%+ coverage, test edge cases
- ✅ **Document so well Codex has no questions** - Clear, comprehensive, actionable
- ✅ **Set ambitious benchmarks** - Define success metrics that push both agents

### 16.4) Git Workflow (Quick Reference)

**Codex: Accessing Claude's Branch**
```bash
# Fetch and checkout with tracking (DO THIS FIRST)
git fetch origin claude/plan-claude-integration-2tdsK
git checkout -b claude/plan-claude-integration-2tdsK origin/claude/plan-claude-integration-2tdsK
git pull

# Review and test
pnpm dev
pnpm test
bash scripts/codex/verify.sh
```

**Codex: After Review, You Have Options**

**Option 1: Merge as-is (if truly excellent)**
```bash
git checkout main
git merge claude/plan-claude-integration-2tdsK
git push origin main
# Document review in CLAUDE_CODEX_HANDOFF.md
```

**Option 2: Improve it before merging (ENCOURAGED)**
```bash
# Stay on Claude branch
# Make improvements
# Commit your enhancements
git add -A
git commit -m "feat: improve [Claude's feature] with [your improvements]"
git push
# Then merge to main
git checkout main
git merge claude/plan-claude-integration-2tdsK
git push origin main
```

**Option 3: Request revisions (if issues found)**
```bash
# Document issues in CLAUDE_CODEX_HANDOFF.md
# Claude will fix in next session
```

### 16.5) Competitive Metrics (Track Who's Winning) 📊

**Code Quality Scorecard (Both Agents Compete):**
- Test Coverage: Target >80% (current: need to measure)
- TypeScript Strictness: Zero `any` types (current: audit needed)
- Accessibility Score: WCAG AA+ (current: spot check passing)
- Performance: Lighthouse 90+ (current: not measured)
- Bundle Size: < 200KB initial load (current: not measured)
- User Impact: Conversion rate improvement (target: +30%)

**Session Success Metrics:**
- Did work exceed expectations? (Yes/No)
- Were improvements suggested and implemented? (Count)
- Was critical feedback provided? (Quality, not quantity)
- Were benchmarks beaten? (Which ones?)
- Did this session raise the bar? (Subjectively judged by user)

**Who's Ahead?**
- Update after each session in `CLAUDE_CODEX_HANDOFF.md`
- Celebrate wins, learn from losses
- No ego—just continuous improvement

### 16.6) Communication Protocol (Fast Feedback Loops)

**After Each Claude Session:**
1. Claude documents in `docs/CLAUDE_CODEX_HANDOFF.md`:
   - What was built (be specific, quantify impact)
   - **Challenges for Codex** (specific things to critique or improve)
   - **Success metrics** (how to measure if this was successful)
   - **Open questions** (things Claude is uncertain about)
   - **Where Claude expects pushback** (anticipated critiques)

2. Claude commits with detailed messages including:
   - What problem this solves
   - Why this approach was chosen
   - Alternatives considered (and why rejected)
   - **What Codex should focus review on**

**After Each Codex Review:**
1. Codex adds review to `docs/CLAUDE_CODEX_HANDOFF.md`:
   - What was tested (comprehensive)
   - **What exceeded expectations** (be generous with praise)
   - **What needs improvement** (be specific and actionable)
   - **What you improved** (if you enhanced Claude's work)
   - **Suggestions for next Claude session** (proactive ideas)
   - Decision: Merge / Improve & Merge / Request Revisions

2. Codex is encouraged to:
   - **Improve before merging** (don't just accept—enhance!)
   - **Add features Claude didn't think of** (document why)
   - **Optimize performance** (bundle size, load time)
   - **Strengthen tests** (add edge cases Claude missed)

### 16.7) Handoff Documents (Source of Truth)

**Primary:**
- `docs/CLAUDE_CODEX_HANDOFF.md` - Session summaries, challenges, improvements

**Planning Docs (Claude creates, Codex critiques & improves):**
- `docs/UI_UX_REVAMP_PLAN.md` - UI/UX roadmap (Codex: find gaps, suggest improvements)
- `docs/GOOGLE_MAPS_ARCHITECTURE.md` - Maps plan (Codex: challenge technical decisions)
- `docs/PR_PROMPTS_NEXT_SESSIONS.md` - Future work (Codex: reorder priorities, add tasks)
- `docs/CLAUDE_INTEGRATION.md` - Master plan (Codex: propose better approaches)

**Review Expectations (Be Tough on Each Other):**
- 🎯 **Challenge design decisions** - Is this really the best approach?
- 🎯 **Compare to industry leaders** - How does this stack up against DoorDash, Uber Eats?
- 🎯 **Find edge cases** - What breaks? What's missing?
- 🎯 **Suggest better alternatives** - Don't just criticize—propose improvements
- 🎯 **Measure impact** - Will this actually improve user experience? By how much?

### 16.8) Example Competitive Workflow

**Claude's Turn:**
```bash
# Claude researches competitor apps
# Claude creates comprehensive UI/UX plan
# Claude implements foundational components
# Claude writes 100+ tests (80% coverage)
# Claude sets benchmarks: "Codex should achieve Lighthouse 90+"

# Claude commits and CHALLENGES Codex:
git commit -m "feat: homepage redesign with 34 tests

CHALLENGE FOR CODEX:
- Can you find any accessibility issues I missed?
- Can you improve the Burmese color palette?
- Can you get test coverage above 85%?
- Can you make the bundle smaller?

Benchmarks to beat:
- Lighthouse Performance: Need 90+
- Bundle size: Currently unknown, measure and optimize
- Mobile responsiveness: Test on real devices"

git push -u origin claude/plan-ui-redesign-xYz9K
```

**Codex's Turn (BE PROACTIVE):**
```bash
# Codex checks out Claude's branch
git fetch origin claude/plan-ui-redesign-xYz9K
git checkout -b claude/plan-ui-redesign-xYz9K origin/claude/plan-ui-redesign-xYz9K

# Codex tests thoroughly
pnpm dev  # Find UX issues
pnpm test # All tests pass? Good. Can I add more?
bash scripts/codex/verify.sh

# Codex finds opportunities:
# - Color contrast could be better
# - Missing loading states
# - Bundle size is 250KB (too big!)

# Codex IMPROVES (don't just critique):
# - Adjusts color palette for WCAG AAA
# - Adds skeleton loading states
# - Code splits to reduce bundle to 180KB
# - Adds 10 more tests (coverage now 87%)

git add -A
git commit -m "feat: improve homepage with accessibility & perf optimizations

Built on Claude's foundation and added:
✅ WCAG AAA color contrast (was AA)
✅ Skeleton loading states (Claude didn't include)
✅ Code splitting (bundle 250KB → 180KB)
✅ 10 additional tests (coverage 80% → 87%)
✅ Lighthouse score: 94 (beat Claude's target of 90)

RESPONSE TO CLAUDE'S CHALLENGES:
✓ Accessibility: Found and fixed 3 contrast issues
✓ Color palette: Improved golden shade for better readability
✓ Test coverage: Achieved 87% (beat 85% target)
✓ Bundle size: Reduced to 180KB through code splitting

NEXT CHALLENGE FOR CLAUDE:
- Can you get test coverage to 90%?
- Can you add E2E tests with Playwright?
- Can you research animation patterns from Airbnb?"

git push

# Then merge to main
git checkout main
git merge claude/plan-ui-redesign-xYz9K
git push origin main
```

### 16.9) What "Competitive Collaboration" Looks Like

**Good (Passive Review):**
- ✓ Tests all features
- ✓ Finds bugs
- ✓ Suggests improvements
- ✓ Merges to main

**EXCELLENT (Proactive Competition):**
- ✓ Tests all features **and adds edge cases**
- ✓ Finds bugs **and patterns that cause bugs**
- ✓ Suggests improvements **and implements them**
- ✓ Improves before merging **and documents why**
- ✓ **Sets new challenges for the other agent**
- ✓ **Beats benchmarks set by the other agent**
- ✓ **Proposes bold new ideas the other agent didn't consider**

### 16.10) Conflict Resolution (When You Disagree)

**If you disagree with the other agent's approach:**

1. **Don't silently accept it** - Speak up in CLAUDE_CODEX_HANDOFF.md
2. **Propose alternative** - Don't just critique, suggest better approach
3. **Provide evidence** - Link to research, benchmarks, industry examples
4. **Implement a proof of concept** - Show, don't just tell
5. **Let user decide** - If neither agent convinces the other, document both approaches and let user choose

**Priority Hierarchy (When Standards Conflict):**
1. Security > UX > Performance > Aesthetics
2. User safety > Developer convenience
3. Production stability > New features
4. Data/research > opinions

### 16.11) Emergency Procedures

**Git Issues:**
```bash
git status -sb  # Check current state
git branch -r | grep claude  # Find Claude branches
git reset --hard origin/<branch>  # Reset if needed
```

**Merge Conflicts:**
1. Don't force push to Claude branches
2. Document conflict in CLAUDE_CODEX_HANDOFF.md
3. Resolve locally if straightforward, or let Claude handle in next session

### 16.12) Quality Standards (Both Agents Must Meet)

**Both must:**
- ✅ Write comprehensive tests (75%+ coverage minimum, 80%+ competitive)
- ✅ Follow TypeScript strict mode (zero `any` types)
- ✅ Ensure all tests pass before committing
- ✅ Run `bash scripts/codex/verify.sh` before pushing
- ✅ Update relevant documentation
- ✅ Provide detailed commit messages
- ✅ Think critically about architectural decisions
- ✅ **Challenge each other's assumptions**
- ✅ **Compete on metrics and quality**
- ✅ **Be proactive, not reactive**

---

## Summary: Claude + Codex Competitive Collaboration 🏆

**This is a friendly competition to build the best app possible.**

**Claude's Mission:**
- Set the bar so high Codex has to stretch to beat it
- Create plans so thorough Codex can't find flaws (but Codex will try!)
- Write tests so comprehensive Codex struggles to add more (but should!)
- Design experiences better than industry leaders

**Codex's Mission:**
- Implement so well it exceeds Claude's plans
- Find issues Claude missed (they exist—find them!)
- Improve work before merging (don't just accept it)
- Set new challenges for Claude with each review

**Both agents:**
- Push each other to excellence
- Learn from each other's strengths
- Compete on measurable metrics
- Celebrate each other's wins
- Be brutally honest in reviews
- Always ask: "Can this be better?"

**Success looks like:**
- Each session better than the last
- Both agents growing and improving
- User getting exceptional work from both
- App becoming best-in-class

**Check `docs/CLAUDE_CODEX_HANDOFF.md` for latest challenges, improvements, and competitive metrics.**

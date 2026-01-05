# 🎯 Codex Next Steps - Prioritized Action Plan

**Date:** 2026-01-05
**Session Focus:** Platform stability → Auth fixes → UI polish → Marketing features
**Estimated Total Time:** 8-12 hours across 4-5 PRs

---

## 📋 Quick Reference

**Start Here:** Priority 0 (P0) items MUST be completed first
**Then:** Priority 1 (P1) items for high-value polish
**Finally:** Priority 2 (P2) items for additional improvements

**Status Legend:**
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete

---

## 🚨 Priority 0 (P0) - CRITICAL - DO THESE FIRST

### 1. Platform/DevEx Improvements 🔴

**Branch:** `codex/platform-p0-devex`
**Time:** 1-2 hours
**Status:** 🔴 Not Started
**Why Critical:** Blocks Codex workflow in ephemeral environments

#### What to Build
Create infrastructure for Codex to work without real secrets:
- Safe environment variable stubs
- Git sync utilities
- Build verification that works anywhere
- Documentation for DevEx

#### Tasks Checklist
- [ ] Create `scripts/codex/load-env.sh`
  - Add safe stub values for all required env vars
  - Set `CODEX_VERIFY=1` flag
  - Document each stub value
- [ ] Update `scripts/codex/verify.sh`
  - Source load-env.sh at start
  - Pass CODEX_VERIFY to build process
  - Ensure all checks pass
- [ ] Create `scripts/codex/git-sync-main.sh`
  - Best-effort sync to origin/main
  - Handle missing remote gracefully
  - Document usage
- [ ] Update `src/lib/supabase/env.ts`
  - Strict checks in production
  - Tolerant during CODEX_VERIFY=1
  - Keep runtime safety
- [ ] Document in `docs/07-workflow/codex-devex.md`
  - How env loading works
  - When to use verify mode
  - Troubleshooting guide

#### Success Criteria
- ✅ `bash scripts/codex/verify.sh` passes without real secrets
- ✅ Build succeeds in ephemeral environment
- ✅ Runtime env checks remain strict in production
- ✅ Documentation clear and complete

#### Files to Modify
- `scripts/codex/load-env.sh` (create)
- `scripts/codex/verify.sh` (update)
- `scripts/codex/git-sync-main.sh` (create)
- `src/lib/supabase/env.ts` (update)
- `docs/07-workflow/codex-devex.md` (update)

#### Reference
📖 `.github/codex/prompts/platform-p0-devex.md`

---

### 2. Admin Login Redirect Loop Fix 🔴

**Branch:** `codex/auth-p0-admin-login-fix`
**Time:** 1-2 hours
**Status:** 🔴 Not Started
**Why Critical:** Admin can't log in, infinite redirect loop

#### What to Build
Fix admin login by moving it out of protected layout:
- Restructure route groups for `/admin/login`
- Keep other admin pages protected
- Improve login error messages
- Test auth flows

#### Tasks Checklist
- [ ] Restructure `/admin/login` route
  - Move out of `(admin)` layout protection
  - Keep URL as `/admin/login`
  - Use Next.js 14 route groups
- [ ] Keep admin protection on other pages
  - Verify `(admin)/layout.tsx` server-side gating
  - Test admin pages require `is_admin=true`
  - Ensure non-admins blocked
- [ ] Improve login error messaging
  - Create auth error helper
  - Message: "No active account found or credentials are incorrect. Please sign up."
  - Same message for invalid vs missing user (prevent enumeration)
- [ ] Apply to both `/login` and `/admin/login`
  - Consistent error messaging
  - Same UX patterns
- [ ] Test thoroughly
  - Admin can log in without redirect loop
  - Non-admin blocked from admin pages
  - Friendly error messages work
  - No user enumeration vulnerability

#### Success Criteria
- ✅ `/admin/login` loads without infinite redirects
- ✅ Admin pages protected server-side (`profiles.is_admin`)
- ✅ Friendly error messages (no enumeration)
- ✅ Manual QA passed

#### Files to Modify
- `src/app/(admin)/login/page.tsx` → Move to new location
- Create route group structure for admin login
- `src/lib/auth/errors.ts` (create helper)
- Update both login pages with improved errors

#### Reference
📖 `.github/codex/prompts/auth-p0-admin-login-fix.md`

---

## ⭐ Priority 1 (P1) - HIGH VALUE - DO THESE NEXT

### 3. UI Polish - Navigation & Contrast 🔴

**Branch:** `codex/ui-p1-nav-contrast-gradients`
**Time:** 2-3 hours
**Status:** 🔴 Not Started
**Why Important:** Significantly improves UX and accessibility

#### What to Build
Fix mobile UI issues and add polish:
- Mobile menu overlay improvements
- Contrast fixes for accessibility
- Hover effects and gradients
- Icon additions

#### Tasks Checklist
- [ ] Fix mobile menu overlay issues
  - Solid background (`bg-background`)
  - Correct z-index layering
  - Backdrop overlay
  - No transparency bleed-through
  - Test in light/dark themes
- [ ] Fix contrast issues
  - Button text readable in all themes
  - Use shadcn color tokens
  - Ensure WCAG AA compliance
  - Focus rings visible
- [ ] Add hover gradient effects
  - Primary CTAs get gradient on hover
  - Smooth transitions
  - Tasteful, not flashy
  - Respect `prefers-reduced-motion`
- [ ] Add icons to navigation
  - Use lucide-react
  - Add to main nav items
  - Add to key CTAs
  - Consistent sizing and spacing
- [ ] Document fixes
  - Create/update `docs/UI_POLISH_REPORT.md`
  - List issues fixed
  - Note remaining polish items

#### Success Criteria
- ✅ Mobile overlays have solid backgrounds
- ✅ WCAG AA contrast compliance
- ✅ Smooth hover transitions
- ✅ Icons enhance navigation
- ✅ Animations respect reduced-motion
- ✅ Works in light and dark themes

#### Files to Modify
- Mobile navigation components
- Button components (hover states)
- Theme CSS variables
- Navigation components (add icons)
- `docs/UI_POLISH_REPORT.md` (create/update)

#### Reference
📖 `.github/codex/prompts/ui-p1-nav-contrast-gradients.md`

---

### 4. Marketing - ZIP Coverage & Public Menu 🔴

**Branch:** `codex/marketing-p1-coverage-menu`
**Time:** 2-3 hours
**Status:** 🔴 Not Started
**Why Important:** Improves conversion, shows service before signup

#### What to Build
Add public-facing marketing features:
- ZIP code coverage checker
- Public weekly menu display
- SEO-friendly content
- Rate limiting

#### Tasks Checklist
- [ ] Create ZIP coverage checker
  - Form component on homepage
  - Server action/API route
  - Google Maps Distance Matrix API
  - Return: eligible/not + reason + ETA/distance
  - Cache results by ZIP code
  - Rate limiting (prevent abuse)
- [ ] Create public weekly menu section
  - Display current week's published menu
  - Grouped by day
  - Show package options
  - Friendly empty state if none published
  - SEO-friendly markup
- [ ] Add RLS policies
  - Allow public SELECT on published menus
  - Ensure unpublished menus stay private
  - Test security
- [ ] Style and polish
  - Mobile-responsive
  - Attractive design
  - Clear CTAs to sign up
  - Fast loading

#### Success Criteria
- ✅ ZIP checker works accurately
- ✅ Shows distance/ETA when eligible
- ✅ Rate limiting prevents abuse
- ✅ Weekly menu visible on homepage
- ✅ RLS policies secure
- ✅ SEO-friendly markup
- ✅ Fast performance

#### Files to Modify
- `src/app/(marketing)/page.tsx` (homepage)
- Create ZIP checker component
- Create public menu component
- Create API route/server action for ZIP check
- Update RLS policies for public menu access
- Add caching logic

#### Reference
📖 `.github/codex/prompts/marketing-p1-coverage-menu.md`

---

### 5. Admin Menu CRUD Review & Fixes 🔴

**Branch:** `codex/review-and-fix-admin-menu-crud-features`
**Time:** 2-3 hours
**Status:** 🔴 Not Started
**Why Important:** Ensures admin operations are smooth

#### What to Do
Review and test admin menu management:
- Test all CRUD operations
- Fix any bugs found
- Improve performance
- Document QA findings

#### Tasks Checklist
- [ ] Review implementation
  - Read current admin menu code
  - Understand data flow
  - Check for obvious issues
- [ ] Test menu template operations
  - Create template
  - Edit template
  - Delete template
  - List templates
- [ ] Test weekly menu generation
  - Generate from template
  - Verify correct dates
  - Check meal items populated
  - Test publish/unpublish
- [ ] Test menu item reordering
  - Drag-and-drop functionality
  - Order persists correctly
  - No UI glitches
- [ ] Test add from catalog
  - Browse meal items
  - Add to template
  - Verify added correctly
- [ ] Fix bugs discovered
  - Document each bug
  - Fix and test
  - Verify no regressions
- [ ] Performance testing
  - Operations complete quickly (<500ms)
  - No N+1 queries
  - Optimized database access
- [ ] Document findings
  - Create QA report
  - List bugs found and fixed
  - Note improvements made

#### Success Criteria
- ✅ All CRUD operations work smoothly
- ✅ Drag-drop reordering stable
- ✅ No data corruption
- ✅ Fast performance (<500ms)
- ✅ No critical bugs
- ✅ QA report complete

#### Files to Review/Modify
- Admin menu pages
- Menu template components
- Weekly menu components
- Database queries
- API routes
- Create QA report document

#### Reference
📖 `.github/codex/prompts/review-and-fix-admin-menu-crud-features.md`

---

## 🌟 Priority 2 (P2) - NICE-TO-HAVE - DO THESE AFTER P0/P1

### 6. Error Boundaries for Routes 🔴

**Branch:** `codex/routing-r1-groups-boundaries`
**Time:** 1-2 hours
**Status:** 🔴 Not Started

#### What to Build
Add route-level error boundaries:
- Error boundary for `/schedule`
- Error boundary for `/track`
- Retry functionality
- Graceful degradation

#### Tasks
- [ ] Add `error.tsx` for `/schedule` segment
- [ ] Add `error.tsx` for `/track` segment
- [ ] Implement retry CTA via `reset()`
- [ ] Add secondary link to `/account`
- [ ] Keep layouts server-driven
- [ ] Test error boundary triggers

#### Reference
📖 `.github/codex/prompts/routing-r1-groups-boundaries.md`

---

### 7. Performance Optimization 🔴

**Time:** 2-3 hours
**Status:** 🔴 Not Started

#### What to Build
- Code splitting (lazy load admin/maps)
- Bundle size analysis and reduction
- Image optimization
- Service worker for offline
- Database query caching

#### Target Metrics
- Lighthouse Score: >90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle size: <300KB initial

---

### 8. E2E Test Expansion 🔴

**Time:** 3-4 hours
**Status:** 🔴 Not Started

#### What to Build
- E2E: Driver authentication flow
- E2E: Admin menu operations
- E2E: Full customer journey
- E2E: Order placement to delivery

---

### 9. Security Hardening 🔴

**Branch:** `codex/security-s1-hardening`
**Time:** 2-4 hours
**Status:** 🔴 Not Started

#### What to Build
- CSP headers implementation
- Webhook security validation
- Rate limiting on auth endpoints
- Security testing (SQL injection, XSS)

#### Reference
📖 `.github/codex/prompts/security-s1-hardening.md`

---

## 📊 Implementation Order Recommendation

### Session 1 (2-3 hours) - Platform Stability
1. ✅ Platform/DevEx Improvements (P0) - 1-2 hours
2. ✅ Admin Login Fix (P0) - 1-2 hours

**Why:** These unblock all future work and fix critical bugs

---

### Session 2 (3-4 hours) - UI & Marketing
3. ✅ UI Polish (P1) - 2-3 hours
4. ✅ Marketing Features (P1) - 2-3 hours

**Why:** High-value improvements for user experience and conversion

---

### Session 3 (2-3 hours) - Admin & Testing
5. ✅ Admin Menu Review (P1) - 2-3 hours

**Why:** Ensure admin tools work perfectly

---

### Session 4+ (Variable) - Optimization
6. Error Boundaries (P2)
7. Performance Optimization (P2)
8. E2E Test Expansion (P2)
9. Security Hardening (P2)

**Why:** Nice-to-have improvements after critical items done

---

## 🎯 Quick Start Guide

### For Your Next Session

1. **Choose a PR** from P0 list above
2. **Read the prompt** in `.github/codex/prompts/[feature].md`
3. **Create branch:** `git checkout -b codex/[feature-name]`
4. **Implement** following the checklist
5. **Verify:** `bash scripts/codex/verify.sh`
6. **Commit & Push:** Update handoff doc
7. **Move to next PR**

### Speed Tips

- Start with P0 items (they're blocking)
- Read the full prompt before starting
- Follow the checklists carefully
- Test as you build (don't save testing for end)
- Update docs as you go
- Run verify frequently (catch issues early)

---

## 📝 After Each PR

Update these files:
- `docs/CLAUDE_CODEX_HANDOFF.md` - Session summary
- `docs/PROGRESS.md` - Mark item complete
- `docs/01-active/BACKLOG.md` - Update status
- This file - Mark item 🟢 Complete

---

## 🎓 Resources

### Documentation
- **[CODEX_WORKFLOW.md](../07-workflow/CODEX_WORKFLOW.md)** - Workflow guide
- **[BACKLOG.md](./BACKLOG.md)** - Acceptance criteria
- **[Prompts Directory](../../.github/codex/prompts/)** - All PR specs

### Tools
- `bash scripts/codex/verify.sh` - Verification
- `pnpm dev` - Local development
- `pnpm test` - Run tests
- `pnpm build` - Production build

---

## ✅ Success Metrics

After completing P0+P1 items, we should have:
- ✅ Codex workflow stable in any environment
- ✅ Admin login working perfectly
- ✅ UI polished and accessible
- ✅ Marketing features driving conversion
- ✅ Admin tools verified and smooth

**This represents ~8-10 hours of focused work across 4-5 PRs**

---

**Last Updated:** 2026-01-05
**Status:** Ready for implementation
**Next Action:** Start with `codex/platform-p0-devex`

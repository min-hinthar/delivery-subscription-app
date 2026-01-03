# Claude + Codex Quick Workflow Guide

**Purpose:** Quick reference for dual-agent collaboration
**Full Details:** See AGENTS.md Section 16

---

## 🚦 Quick Start for Codex

### Reviewing Claude's Work

**Current Branch:** `claude/plan-claude-integration-2tdsK`

```bash
# 1. Fetch Claude's branch
git fetch origin claude/plan-claude-integration-2tdsK

# 2. Checkout with tracking (CRITICAL - don't skip this)
git checkout -b claude/plan-claude-integration-2tdsK origin/claude/plan-claude-integration-2tdsK

# 3. Pull latest changes
git pull

# 4. Review and test
pnpm dev
pnpm test
bash scripts/codex/verify.sh

# 5. Read handoff documents
cat docs/CLAUDE_CODEX_HANDOFF.md
```

### Common Git Error: "no tracking information"

**Problem:**
```
There is no tracking information for the current branch.
```

**Solution:**
```bash
git branch --set-upstream-to=origin/claude/plan-claude-integration-2tdsK
git pull
```

---

## 📋 Review Checklist

When reviewing Claude's work, check:

- [ ] Read `docs/CLAUDE_CODEX_HANDOFF.md` (full document)
- [ ] Run `pnpm dev` and manually test all changes
- [ ] Run `pnpm test` and verify all tests pass
- [ ] Run `bash scripts/codex/verify.sh`
- [ ] Test mobile responsive behavior
- [ ] Test dark mode
- [ ] Review code for security issues
- [ ] Review code for performance issues
- [ ] Check accessibility (keyboard navigation, screen reader)
- [ ] Compare against industry best practices
- [ ] Read planning docs (UI_UX_REVAMP_PLAN.md, GOOGLE_MAPS_ARCHITECTURE.md)

---

## 💬 Providing Feedback

### If Approving (Merge to Main)

```bash
# Switch to main and merge
git checkout main
git merge claude/plan-claude-integration-2tdsK
git push origin main

# Add review feedback to handoff doc
# Edit docs/CLAUDE_CODEX_HANDOFF.md and add:
## Codex Review - Session 3 (APPROVED)
**Reviewer:** Codex
**Date:** [date]

### What Was Tested
- Tested homepage on dev server
- All 100 tests passing
- Mobile responsive works correctly
- Dark mode verified

### Strengths
- [list strengths]

### Approved for Main
- Merge completed
- Ready for production deployment

### Recommended Next Steps
- [suggest next PR to work on]
```

### If Requesting Revisions

```bash
# DON'T merge yet
# Add review feedback to handoff doc
# Edit docs/CLAUDE_CODEX_HANDOFF.md and add:
## Codex Review - Session 3 (REVISIONS REQUESTED)
**Reviewer:** Codex
**Date:** [date]

### What Was Tested
- [what you tested]

### Issues Found
1. **[Issue Title]**
   - Problem: [description]
   - Impact: [user impact]
   - Suggested Fix: [specific recommendation]

2. **[Issue Title]**
   - Problem: [description]
   - Impact: [user impact]
   - Suggested Fix: [specific recommendation]

### Required Changes
- [ ] [specific change needed]
- [ ] [specific change needed]

### Next Action
Claude to address revisions in next session
```

---

## 🔄 Division of Labor

### Claude Code Responsibilities
- **Planning & Architecture** - Create comprehensive plans
- **Research** - Industry benchmarking, best practices
- **UI/UX Design** - Mockups, design system
- **Testing** - Write comprehensive test suites
- **Documentation** - Maintain docs, handoff notes

**Claude Branch Pattern:** `claude/<description>-<session-id>`

### Codex Responsibilities
- **Implementation** - Build features per plans
- **Code Review** - Critical feedback on Claude's work
- **Bug Fixes** - Fix issues in production
- **Optimization** - Performance, bundle size
- **Deployment** - Production concerns

**Codex Branch Pattern:** `codex/<description>`

---

## 📁 Key Documents

### Always Check These
1. **`docs/CLAUDE_CODEX_HANDOFF.md`** - Session summaries, latest status
2. **`AGENTS.md` Section 16** - Full collaboration rules
3. **`docs/PR_PROMPTS_NEXT_SESSIONS.md`** - What's planned next

### Planning Documents (Claude Creates)
- `docs/UI_UX_REVAMP_PLAN.md` - Complete UI/UX redesign plan
- `docs/GOOGLE_MAPS_ARCHITECTURE.md` - Maps integration architecture
- `docs/CLAUDE_INTEGRATION.md` - Master integration plan
- `docs/TESTING_STRATEGY.md` - Testing approach

### Standards (Both Follow)
- `docs/BLUEPRINT.md` - Product requirements
- `docs/SECURITY_QA.md` - Security standards
- `docs/NEXTJS16_ROUTING_STANDARDS.md` - Technical standards
- `docs/QA_UX.md` - UX requirements

---

## 🆘 Troubleshooting

### Can't Find Claude Branch
```bash
# List all Claude branches
git branch -r | grep claude

# Check handoff doc for latest branch
cat docs/CLAUDE_CODEX_HANDOFF.md | head -10
```

### Git Conflicts
```bash
# DON'T force push to Claude branches
# Document the conflict in CLAUDE_CODEX_HANDOFF.md
# Let Claude resolve in next session
```

### Tests Failing
```bash
# Check what tests are failing
pnpm test

# Check if it's a known issue
cat docs/CLAUDE_CODEX_HANDOFF.md | grep -A 5 "Known Issues"

# Document in handoff if new issue
```

### Build Errors
```bash
# Verify build with Codex script
bash scripts/codex/verify.sh

# Check TypeScript errors
pnpm run typecheck

# Document in handoff if blocking
```

---

## ✅ Success Criteria

**Good Collaboration Looks Like:**
- ✅ Clear communication through handoff docs
- ✅ Critical, constructive feedback (not rubber-stamping)
- ✅ All tests passing before merge
- ✅ Both agents challenging each other's assumptions
- ✅ Documentation always up to date
- ✅ Proper git workflow (no force pushes, proper tracking)

**Bad Collaboration Looks Like:**
- ❌ Skipping handoff document updates
- ❌ Merging without testing
- ❌ Accepting work without critical review
- ❌ Git force pushes or broken tracking
- ❌ Undocumented changes
- ❌ Ignoring standards in AGENTS.md

---

## 🎯 Current Status

**Last Claude Session:** Session 3 (Homepage Redesign)
**Current Branch:** `claude/plan-claude-integration-2tdsK`
**Status:** Ready for Codex review
**Tests:** 100/100 passing ✅
**TypeScript:** Clean ✅

**Next Actions for Codex:**
1. Follow "Reviewing Claude's Work" steps above
2. Test homepage redesign thoroughly
3. Provide critical feedback
4. Decide: Merge to main OR request revisions
5. Update `docs/CLAUDE_CODEX_HANDOFF.md` with review

---

**Questions?** Check `AGENTS.md` Section 16 for full details.

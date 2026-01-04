# 🎯 Codex Workflow - Speed-Optimized Implementation

**Your Role:** Senior full-stack developer - implement features FAST from main branch
**Claude's Role:** Planning, architecture, code review, testing, revision
**Workflow:** You implement → Claude reviews/tests/revises → Repeat FAST

---

## ⚡ SPEED-OPTIMIZED WORKFLOW (NEW!)

**Goal:** Implement features as fast as possible with minimal testing
**Strategy:** You focus on implementation, Claude handles comprehensive review/testing

### Key Changes:
- ✅ **Minimal Testing:** Only run `bash scripts/codex/verify.sh` (build + lint + typecheck)
- ✅ **Skip Comprehensive Tests:** Don't write full test suites - Claude will add later
- ✅ **Push Frequently:** Commit and push as soon as feature works
- ✅ **Move Fast:** Implement multiple PRs per session if possible
- ⏭️ **Skip Deep Review:** Quick self-check, Claude does thorough review

---

## 📍 Quick Start (Every Session)

### 1. Always Start From Main
```bash
git checkout main
git pull origin main
```

### 2. Check What To Build
Read these in order:
1. **`docs/CLAUDE_CODEX_HANDOFF.md`** - Latest plans and next tasks
2. **`docs/PR_PROMPTS_NEXT_SESSIONS.md`** - Feature requests with acceptance criteria

### 3. Create Your Branch From Main
```bash
git checkout -b codex/[feature-name]
# Example: git checkout -b codex/weekly-menu-redesign
```

### 4. Build, Verify, Commit (MINIMAL TESTING)
```bash
# Work on feature
pnpm dev
# Test it works manually (quick check only!)

# Before committing - ONLY run verify (minimal testing)
bash scripts/codex/verify.sh

# IF verify passes, commit immediately
git add -A
git commit -m "feat: [feature-name]"

# Push right away
git push -u origin codex/[feature-name]
```

### 5. Update Handoff Doc (Quick)
Add brief session note to `docs/CLAUDE_CODEX_HANDOFF.md`:
```markdown
## Codex Session - [Feature Name]
**Date:** [date]
**Branch:** codex/[branch-name]

### Implemented
- [What you built - bullet points]

### For Claude to Review
- [Areas needing attention]

### Status
- [x] Feature works
- [x] Build passes
- [ ] Claude review pending
```

---

## 📚 Documents You Need (Quick Reference)

### Essential (Read These)
- **`docs/CLAUDE_CODEX_HANDOFF.md`** - What to build next
- **`docs/PR_PROMPTS_NEXT_SESSIONS.md`** - Feature specs

### Reference (Skim As Needed)
- **`AGENTS.md`** - Coding standards
- **`docs/BLUEPRINT.md`** - Product requirements
- **`docs/UI_UX_REVAMP_PLAN.md`** - UI/UX designs

---

## 🔄 Speed-Optimized Workflow

### Claude's NEW Responsibilities (You Don't Do These)
- ✅ Write comprehensive tests
- ✅ Review and revise your code
- ✅ Fix bugs and edge cases
- ✅ Add error handling
- ✅ Improve accessibility
- ✅ Update documentation

### Your NEW Responsibilities (Focus Here)
- ⚡ Implement features FAST from plans
- ⚡ Make it work (don't worry about perfect)
- ⚡ Follow basic standards (TypeScript, no `any`, server components)
- ⚡ Run minimal verify only
- ⚡ Push and move to next feature

### Workflow Cycle (FAST)
```
1. Claude: Creates plan/design
2. User: Merges to main
3. You (Codex): Implement feature FAST (minimal testing)
4. You: Push to codex/* branch
5. Claude: Reviews, tests, revises, improves
6. User: Merges to main
7. Repeat QUICKLY
```

---

## ✅ Before Every Commit (MINIMAL TESTING)

```bash
# ONLY run verify (build + lint + typecheck)
bash scripts/codex/verify.sh
```

**That's it!** No need to run `pnpm test` or write tests.
Claude will handle comprehensive testing in review phase.

---

## ⚡ Implementing Multiple PRs (SPEED MODE)

**Goal:** Implement 3-5 PRs per session instead of 1

### Strategy:
1. Choose 3-5 **small** features from `docs/PR_PROMPTS_NEXT_SESSIONS.md`
2. Implement each quickly (30-45 min each)
3. For each PR:
   ```bash
   git checkout main
   git pull
   git checkout -b codex/[feature-name]
   # Implement feature
   bash scripts/codex/verify.sh
   git add -A && git commit -m "feat: [feature]"
   git push -u origin codex/[feature-name]
   ```
4. Update handoff doc with ALL features at end
5. User reviews all PRs, I (Claude) test and revise

### What Makes a "Quick" PR:
- ✅ Single component creation
- ✅ UI redesign (existing page)
- ✅ Form enhancement
- ✅ API endpoint addition
- ✅ Database schema update
- ❌ Complex multi-file refactors (save for slower sessions)
- ❌ Google Maps integration (too complex)

---

## 🆘 Troubleshooting

### Git Issues
```bash
# Always start from main
git checkout main
git pull origin main

# If confused about branches
git branch -a
```

### Build Issues
```bash
bash scripts/codex/verify.sh
```

### If Verify Fails
- Fix TypeScript errors only
- Skip test failures (Claude will add tests)
- Fix linting errors only if critical

---

## 📋 Quick Checklist (Every Feature)

- [ ] Works in browser (`pnpm dev`)
- [ ] TypeScript compiles
- [ ] Verify passes (`bash scripts/codex/verify.sh`)
- [ ] Committed and pushed
- [ ] Brief note in handoff doc

**Skip:**
- ❌ Writing comprehensive tests
- ❌ Writing documentation
- ❌ Edge case handling
- ❌ Accessibility deep dive
- ❌ Performance optimization

**Claude handles all of the above in review phase!**

---

## 🎯 Success Metrics (Speed Mode)

**Old Workflow:**
- 1 PR per session
- 2-3 hours per PR
- Comprehensive tests written by Codex
- Slow iteration

**New Speed-Optimized Workflow:**
- 3-5 PRs per session
- 30-45 min per PR
- Tests added by Claude in review
- FAST iteration

---

**Focus on SPEED. Claude will handle QUALITY in review.**

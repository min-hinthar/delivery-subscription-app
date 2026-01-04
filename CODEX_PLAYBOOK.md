# 🎯 Codex Playbook - Your Complete Guide

**Last Updated:** 2026-01-03 (Session 3 - Weekly Menu Complete)
**Current Branch:** `codex/collaborate-with-claude-on-app-improvements`
**Your Mission:** Continue competitive collaboration with Claude

---

## 📍 START HERE - What To Do Right Now

### Step 1: Check Current Status
Read the **Status Dashboard** below to see what's been completed and what's next.

### Step 2: Choose Your Path
You have **3 options** based on current work state:

#### Option A: Review Claude's Latest Work ✅
If Claude just finished a session, go to **Section 2: Review Protocol**

#### Option B: Implement Next Feature 🚀
If you're ready to build, go to **Section 3: Implementation Protocol**

#### Option C: Update After Your Work 📝
If you just finished work, go to **Section 4: Handoff Protocol**

---

## 📊 Status Dashboard (Your Single Source of Truth)

### Current State
- **Last Claude Session:** Session 3 - Homepage Redesign ✅
- **Claude's Branch:** `claude/plan-claude-integration-2tdsK`
- **Last Codex Session:** Onboarding Flow Enhancement ✅
- **Your Branch:** `codex/onboarding-enhancement`
- **Main Branch Status:** Needs sync

### What Claude Built (Session 3)
- ✅ Complete homepage redesign with Burmese design
- ✅ 34 comprehensive tests (100/100 passing)
- ✅ ButtonV2 and InputField components
- ✅ Full mobile responsiveness and dark mode
- ⚠️ Issues found by Codex: Nested interactive elements, hardcoded colors

### What Codex Built (Just Now)
- ✅ Onboarding welcome + preferences steps
- ✅ Address autocomplete + manual fallback
- ✅ Household size + delivery preference capture

### What's Next
**Priority 1:** Review onboarding flow UX + verify new preferences storage
**Priority 2:** Address Claude's Session 3 revisions
**Priority 3:** Choose next feature from planning docs

---

## 🔄 Section 2: Review Protocol (When Claude Finishes Work)

### Quick Start
```bash
# 1. Fetch Claude's branch
git fetch origin claude/plan-claude-integration-2tdsK

# 2. Checkout with tracking
git checkout -b claude/plan-claude-integration-2tdsK origin/claude/plan-claude-integration-2tdsK

# 3. Pull latest
git pull

# 4. Review
pnpm dev
pnpm test
bash scripts/codex/verify.sh
```

### Documents To Read (In Order)
1. **`docs/CLAUDE_CODEX_HANDOFF.md`** - What Claude did, challenges issued
2. **`docs/CLAUDE_CODEX_WORKFLOW.md`** - Competitive review checklist
3. **`AGENTS.md` Section 16** - Full collaboration rules

### Your Review Checklist
Use the **5-Phase Competitive Review** from `docs/CLAUDE_CODEX_WORKFLOW.md`:
- [ ] Phase 1: Verify everything works
- [ ] Phase 2: Hunt for issues ruthlessly
- [ ] Phase 3: Compare to industry leaders
- [ ] Phase 4: Implement improvements (don't just critique!)
- [ ] Phase 5: Document your wins

### After Review: Choose Your Action
- **Option 1:** Merge as-is (only if perfect)
- **Option 2:** Improve & merge (ENCOURAGED) ⭐
- **Option 3:** Request revisions (only for complex issues)

### Update These Documents
After review, update:
1. **`docs/CLAUDE_CODEX_HANDOFF.md`** - Add your review using template
2. **`CODEX_PLAYBOOK.md`** (this file) - Update Status Dashboard
3. **Competitive Scorecard** - Update metrics

---

## 🚀 Section 3: Implementation Protocol (When Building Features)

### Find What To Build
Check these documents in order:

1. **`docs/PR_PROMPTS_NEXT_SESSIONS.md`** - 14 detailed PR prompts
   - Choose based on priority (P0 > P1 > P2 > P3)
   - Each has complete checklist and acceptance criteria

2. **`docs/UI_UX_REVAMP_PLAN.md`** - UI/UX roadmap
   - See what's planned for customer/admin experience
   - Find design patterns and mockups

3. **`docs/GOOGLE_MAPS_ARCHITECTURE.md`** - Maps integration plan
   - When ready to implement real-time tracking

4. **`docs/BACKLOG.md`** - Other planned work
   - Additional features and improvements

### Before You Start
1. **Check AGENTS.md rules** - Ensure compliance with standards
2. **Create branch** - Use naming: `codex/<feature-name>`
3. **Read acceptance criteria** - Know what "done" looks like

### While Building
**Standards to Follow:**
- Read **`AGENTS.md`** for all rules (routing, security, testing, etc.)
- Read **`docs/BLUEPRINT.md`** for product requirements
- Read **`docs/NEXTJS16_ROUTING_STANDARDS.md`** for routing patterns
- Read **`docs/SECURITY_QA.md`** for security standards
- Read **`docs/QA_UX.md`** for UX requirements

### Before Committing
```bash
# Run all checks
pnpm test
pnpm run typecheck
bash scripts/codex/verify.sh
```

### Commit Message Format
Use detailed commits (see AGENTS.md Section 16.8 for examples):
```
feat: [feature name]

Built/improved:
✅ [Specific change 1]
✅ [Specific change 2]

Challenges for Claude:
- [Challenge 1]
- [Challenge 2]

Benchmarks achieved:
- [Metric 1]: [Result]
- [Metric 2]: [Result]
```

---

## 📝 Section 4: Handoff Protocol (After You Finish Work)

### Update Handoff Document
**File:** `docs/CLAUDE_CODEX_HANDOFF.md`

Add your session summary using this template:
```markdown
## Codex Session [N] - [Feature Name]

**Date:** [Date]
**Branch:** `codex/[branch-name]`
**Status:** [Complete/In Progress/Blocked]

### What Was Built
- [Detailed list of changes]

### Challenges for Claude
1. **[Challenge Title]**
   - Can you improve [specific aspect]?
   - Target: [Measurable goal]

### Benchmarks Achieved
- Test Coverage: [X]%
- Lighthouse Score: [X]
- Bundle Size: [X]KB
- Accessibility: WCAG [level]

### Files Modified
- Created: [List]
- Modified: [List]

### Next Steps
- For Claude: [Specific tasks]
- For Codex: [What you'll do next]
```

### Update This Playbook
**File:** `CODEX_PLAYBOOK.md` (this file)

Update the **Status Dashboard** section:
- Update "Last Codex Session"
- Update "What Codex Built"
- Update "What's Next"

### Update Competitive Scorecard
**File:** `docs/CLAUDE_CODEX_HANDOFF.md`

Update the metrics table with your results.

### Commit and Push
```bash
git add -A
git commit -m "feat: [your feature]

[Detailed commit message]"
git push -u origin codex/[your-branch]
```

### Optional: Merge to Main
If work is complete and all tests pass:
```bash
git checkout main
git pull origin main
git merge codex/[your-branch]
git push origin main
```

---

## 📚 Document Reference Guide

### Core Rules & Standards
- **`AGENTS.md`** - ALL RULES (read Section 16 for Claude collaboration)
- **`docs/BLUEPRINT.md`** - Product requirements and architecture
- **`docs/NEXTJS16_ROUTING_STANDARDS.md`** - Routing patterns
- **`docs/SECURITY_QA.md`** - Security standards and checklist
- **`docs/QA_UX.md`** - UX requirements and testing

### Planning & Architecture
- **`docs/UI_UX_REVAMP_PLAN.md`** - Complete UI/UX redesign plan (98KB)
- **`docs/GOOGLE_MAPS_ARCHITECTURE.md`** - Maps integration architecture (76KB)
- **`docs/PR_PROMPTS_NEXT_SESSIONS.md`** - 14 detailed PR prompts (53KB)
- **`docs/TESTING_STRATEGY.md`** - Testing approach and infrastructure

### Collaboration & Communication
- **`docs/CLAUDE_CODEX_HANDOFF.md`** - Session summaries, challenges, scorecard
- **`docs/CLAUDE_CODEX_WORKFLOW.md`** - Quick reference for competitive review
- **`docs/CLAUDE_INTEGRATION.md`** - Master integration plan
- **`CODEX_PLAYBOOK.md`** - This file (your master guide)

### Technical Implementation
- **`docs/CODEX_DEVEX.md`** - Developer experience guidelines
- **`docs/ADMIN_OPERATIONS.md`** - Admin features and workflows
- **`docs/CURRENT_APP_TREE.md`** - Current route inventory

### Security
- **`docs/SECURITY_OVERVIEW.md`** - Security architecture
- **`docs/SECURITY_CHECKLIST.md`** - Security requirements
- **`docs/WEBHOOK_SECURITY.md`** - Webhook verification standards
- **`docs/RLS_AUDIT.md`** - Row-level security audit
- **`docs/HEADERS_AND_CSP.md`** - Security headers and CSP

---

## 🏆 Competitive Collaboration Quick Reference

### Your Mission
- **Don't just review—IMPROVE** Claude's work before merging
- **Don't just implement—EXCEED** expectations
- **Don't just critique—COMPETE** to make it better

### Key Principles (from AGENTS.md Section 16)
1. Challenge everything
2. Compete on quality metrics
3. Be proactive, not reactive
4. Raise the bar each session
5. Learn from each other
6. Never rubber-stamp

### Current Competitive Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Test Coverage | 80%+ | ~60% | 🟡 |
| TypeScript | 0 `any` | ✅ | ✅ |
| Accessibility | WCAG AAA | WCAG AA | 🟡 |
| Lighthouse | 90+ | Not measured | 🔴 |
| Bundle Size | <180KB | Not measured | 🔴 |
| Tests Passing | 100% | ✅ | ✅ |

### Success = Beat 4+ Metrics + Set New Challenges

---

## 🆘 Troubleshooting

### Git Issues
```bash
# Branch tracking error
git branch --set-upstream-to=origin/[branch-name]

# Find Claude branches
git branch -r | grep claude

# Reset if needed
git reset --hard origin/[branch-name]
```

### Build Issues
```bash
# Full verification
bash scripts/codex/verify.sh

# Individual checks
pnpm run typecheck
pnpm test
pnpm run lint
```

### Questions?
1. Check **`AGENTS.md` Section 16** - Full collaboration rules
2. Check **`docs/CLAUDE_CODEX_HANDOFF.md`** - Latest status
3. Check **`docs/CLAUDE_CODEX_WORKFLOW.md`** - Quick reference

---

## 🎯 Current Action Items (Updated After Each Session)

### For Codex (You) - Right Now
1. [ ] Merge Weekly Menu Component to main
2. [ ] Update this playbook with Weekly Menu details
3. [ ] Update `CLAUDE_CODEX_HANDOFF.md` with your session
4. [ ] Choose next PR from `PR_PROMPTS_NEXT_SESSIONS.md`

### For Claude - Next Session
1. [ ] Address Codex's revisions (nested elements, design tokens)
2. [ ] Respond to Codex's challenges from Weekly Menu review
3. [ ] Set new benchmarks for next competitive round

---

## 📋 Session Workflow Cheat Sheet

### Every Session: Do These Steps

**Step 1: START**
- [ ] Read this playbook (Status Dashboard section)
- [ ] Read `CLAUDE_CODEX_HANDOFF.md` (latest session summary)
- [ ] Decide: Review Claude's work OR Implement feature

**Step 2: WORK**
- [ ] Follow protocol (Section 2 for review, Section 3 for implementation)
- [ ] Run all checks before committing
- [ ] Use detailed commit messages

**Step 3: HANDOFF**
- [ ] Update `CLAUDE_CODEX_HANDOFF.md` with your session
- [ ] Update `CODEX_PLAYBOOK.md` Status Dashboard
- [ ] Update competitive scorecard
- [ ] Commit and push

**Step 4: NEXT**
- [ ] Set challenges for Claude's next session
- [ ] Identify what Codex should do next
- [ ] Merge to main if work is complete

---

## 🎓 Learning & Improvement

### After Each Session, Ask Yourself
- Did I beat Claude's benchmarks?
- Did I implement improvements (not just suggestions)?
- Did I set ambitious challenges for Claude?
- Did I update all required documents?
- Did the app measurably improve this session?

### Continuous Improvement
- Study competitor apps (DoorDash, Uber Eats, HelloFresh)
- Research best practices (Web.dev, A11y Project)
- Learn from Claude's approach
- Propose bold new ideas

---

**Remember:** This is a friendly competition. Push Claude to do better by doing better yourself. Make every session count! 🏆

**Questions?** Everything you need is in the documents referenced above. Start with AGENTS.md Section 16 for full rules.

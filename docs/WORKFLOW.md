# 🔄 Codex + Claude Workflow Guide

**This document provides copy-paste prompts and templates for coordinating work between Codex and Claude.**

---

## 📋 Table of Contents

1. [Starting a New PR (Codex)](#starting-a-new-pr-codex)
2. [After PR Completion (Claude Review)](#after-pr-completion-claude-review)
3. [After Review (Update Docs)](#after-review-update-docs)
4. [Emergency Fixes](#emergency-fixes)
5. [Document Update Templates](#document-update-templates)

---

## 🚀 Starting a New PR (Codex)

### Step 1: Check What's Next

**Prompt for You:**
```
Check docs/PROGRESS.md - what's the next priority PR?
```

### Step 2: Run Codex with Implementation Prompt

**Copy-paste this to Codex:**

```
Read docs/PROGRESS.md and identify the next priority PR to implement.

Then:
1. Read the implementation guide in docs/01-active/implementation-guides/
2. Read the acceptance criteria in docs/01-active/BACKLOG.md
3. Implement the feature following the guide
4. Write tests for all new functionality
5. Ensure `pnpm build` and `pnpm test` pass
6. Create a PR with a detailed description

After implementation:
- Update docs/PROGRESS.md (mark PR as in-progress)
- Update docs/01-active/BACKLOG.md (mark items as in-progress)

Important:
- Follow the implementation guide step-by-step
- Include acceptance criteria in PR description
- Add "Ready for Review" label when done
- Tag @claude for review
```

### Step 3: Alternative - Specific PR Prompt

If you want to work on a specific PR (e.g., PR #24):

**Codex Prompt:**
```
Implement PR #24 (Mobile UX Enhancement) following these steps:

1. Read docs/01-active/implementation-guides/mobile-ux.md
2. Read acceptance criteria in docs/01-active/BACKLOG.md (search for "Mobile UX")
3. Implement all features in the guide:
   - Bottom navigation bar
   - Touch optimizations (44px tap targets)
   - PWA manifest and install prompt
   - Haptic feedback
   - Swipeable modals

4. Test on mobile viewports (375px, 768px, 1024px)
5. Ensure Lighthouse mobile score >90
6. Create PR with comprehensive description

After completion:
- Mark PR #24 as "in-progress" in docs/PROGRESS.md
- Update docs/01-active/BACKLOG.md status
```

---

## ✅ After PR Completion (Claude Review)

### When Codex Finishes a PR

**Your Prompt to Claude:**

```
Review PR #[NUMBER] created by Codex.

Tasks:
1. Read the PR description and code changes
2. Test the implementation locally (checkout branch, run app)
3. Verify all acceptance criteria from docs/01-active/BACKLOG.md are met
4. Check code quality:
   - TypeScript strict mode compliance
   - Error handling present
   - Security best practices followed
   - Tests cover critical paths
   - No hardcoded secrets

5. Provide detailed feedback:
   - What works well (be specific)
   - What needs improvement (be critical, not just nice)
   - Any bugs or edge cases missed
   - Performance concerns
   - Security issues

6. Rate the PR: [Score]/10
   - 9-10: Outstanding, merge immediately
   - 7-8: Good, minor changes needed
   - 5-6: Acceptable, several improvements needed
   - <5: Major issues, needs significant rework

7. If score ≥7, approve and ask human to merge
8. If score <7, request changes with specific action items

After review:
- Create review document in docs/08-archive/completed-prs/ (if merged)
- Update docs/PROGRESS.md (mark PR complete, update metrics)
- Update docs/01-active/BACKLOG.md (mark items complete)
```

### Alternative: Quick Review Prompt

**For smaller PRs:**

```
Quick review of PR #[NUMBER]:

1. Verify acceptance criteria met (docs/01-active/BACKLOG.md)
2. Test critical paths manually
3. Check for security issues
4. Provide 3-sentence feedback: what's good, what needs improvement, recommendation
5. Approve if ≥7/10, otherwise request changes

Update docs if approved.
```

---

## 📝 After Review (Update Docs)

### When PR is Merged

**Prompt for Claude:**

```
PR #[NUMBER] has been merged. Update documentation:

1. Update docs/PROGRESS.md:
   - Move PR from "What's Next" to "Completed Work"
   - Update completion percentage
   - Update "Last Updated" date

2. Update docs/01-active/BACKLOG.md:
   - Mark related backlog items as ✅ Done
   - Update status to "Completed"

3. Create review document (if significant PR):
   - Save to docs/08-archive/completed-prs/pr[NUMBER]-[name]-review.md
   - Include: summary, highlights, code quality notes, lessons learned

4. Check if any feature specs need updates:
   - If PR implements a feature spec, mark it complete
   - Update implementation status

5. Identify next priority:
   - What should Codex work on next?
   - Update "What's Next" in PROGRESS.md if needed

Provide a summary of updates made.
```

---

## 🚨 Emergency Fixes

### When Production is Broken

**Prompt for Codex:**

```
EMERGENCY: Production issue detected.

Issue: [DESCRIBE THE ISSUE]

Tasks:
1. Identify root cause (check logs, recent changes)
2. Create hotfix branch from main: hotfix/[issue-name]
3. Implement fix with minimal changes
4. Add regression test to prevent recurrence
5. Test thoroughly (cannot break anything else)
6. Create PR with "HOTFIX" label
7. Request immediate review

Skip normal workflow - this takes priority.
```

**Prompt for Claude (Review Hotfix):**

```
URGENT: Review hotfix PR #[NUMBER]

1. Verify fix addresses the issue
2. Check for side effects
3. Ensure tests prevent regression
4. Approve immediately if safe
5. Flag concerns if any

This is time-sensitive.
```

---

## 📄 Document Update Templates

### Template: Update PROGRESS.md After PR

**Use this to update PROGRESS.md:**

```markdown
## Update PROGRESS.md

**PR Completed:** #[NUMBER] - [NAME]

Changes:
1. Move from "What's Next" to "Completed Work":
   - ✅ **PR #[NUMBER]:** [NAME]

2. Update metrics:
   - [Category] Progress: [OLD]% → [NEW]%

3. Update "Last Updated": 2026-01-0[X]

4. Update "Total Completed": [OLD] → [NEW] major PRs
```

### Template: Update BACKLOG.md After PR

```markdown
## Update BACKLOG.md

**PR Completed:** #[NUMBER]

Changes:
1. Find related backlog items
2. Update status:
   - **Status:** ✅ Done
   - Add completion date
   - Add PR link

Example:
```
### P1 — Mobile UX Enhancement
**Status:** ✅ Done (PR #24, 2026-01-08)
**Acceptance:** All criteria met
```

### Template: Create Review Document

**Filename:** `docs/08-archive/completed-prs/pr[NUMBER]-[name]-review.md`

```markdown
# PR #[NUMBER]: [NAME] - Code Review

**Reviewer:** Claude
**Date:** 2026-01-0[X]
**Status:** ✅ Merged
**Rating:** [X]/10

---

## Summary

[1-2 sentence summary of what this PR accomplished]

---

## Highlights

**What Worked Well:**
- [Specific thing 1]
- [Specific thing 2]
- [Specific thing 3]

**Code Quality:**
- TypeScript: [Comments]
- Testing: [Comments]
- Security: [Comments]
- Performance: [Comments]

---

## Implementation Details

**Files Changed:** [COUNT]
**Lines Added:** [COUNT]
**Lines Removed:** [COUNT]

**Key Components:**
1. [Component/feature 1]
2. [Component/feature 2]

---

## Testing

**Tests Added:**
- [Test file 1]
- [Test file 2]

**Manual Testing:**
- [What was tested manually]

---

## Issues Found & Resolved

**Before Merge:**
- [Issue 1] → [Resolution]
- [Issue 2] → [Resolution]

---

## Recommendations for Future

- [Recommendation 1]
- [Recommendation 2]

---

## Overall Assessment

[2-3 sentences on overall quality and production readiness]

**Recommendation:** ✅ Approved and Merged
```

---

## 🔄 Full Cycle Example

### Example: Implementing PR #24 (Mobile UX)

**Day 1 Morning - Human runs Codex:**
```
Implement PR #24 (Mobile UX Enhancement).
Read docs/01-active/implementation-guides/mobile-ux.md and implement all features.
Update docs/PROGRESS.md when you start.
```

**Day 1 Evening - Codex completes, Human runs Claude:**
```
Review PR #24 created by Codex.
Follow review checklist in docs/WORKFLOW.md.
Provide detailed feedback.
```

**Day 2 Morning - Claude reviews, Human merges:**
```
[Claude provides 9/10 review, recommends merge]
Human: Merges PR #24
```

**Day 2 Afternoon - Human runs Claude to update docs:**
```
PR #24 merged. Update docs/PROGRESS.md and docs/01-active/BACKLOG.md.
Create review doc in docs/08-archive/completed-prs/.
Identify next priority.
```

**Day 2 Evening - Human runs Codex for next PR:**
```
Check docs/PROGRESS.md and implement next priority PR.
```

**Repeat cycle!**

---

## 🎯 Best Practices

### For Codex Sessions
- ✅ Always read implementation guides first
- ✅ Check acceptance criteria before starting
- ✅ Update PROGRESS.md when starting and finishing
- ✅ Write comprehensive tests
- ✅ Create detailed PR descriptions
- ❌ Don't skip steps in implementation guide
- ❌ Don't commit without testing
- ❌ Don't merge without Claude review

### For Claude Sessions
- ✅ Be critical, not just nice
- ✅ Test manually, don't just read code
- ✅ Check security and edge cases
- ✅ Provide specific, actionable feedback
- ✅ Update docs after every PR
- ❌ Don't rubber-stamp PRs
- ❌ Don't approve without testing
- ❌ Don't skip doc updates

### For Human Coordination
- ✅ Run Codex for implementation
- ✅ Run Claude for review
- ✅ Merge only after Claude approval
- ✅ Keep docs updated
- ✅ Follow the cycle consistently
- ❌ Don't skip reviews
- ❌ Don't merge failing tests
- ❌ Don't let docs get stale

---

## 📊 Session Handoff Checklist

### After Codex Session
- [ ] PR created with detailed description
- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] PROGRESS.md updated (PR marked in-progress)
- [ ] BACKLOG.md updated (items marked in-progress)
- [ ] Tagged @claude for review

### After Claude Review Session
- [ ] PR reviewed with detailed feedback
- [ ] Score provided (X/10)
- [ ] Approval or change requests submitted
- [ ] Human notified of recommendation

### After PR Merge
- [ ] PROGRESS.md updated (PR marked complete)
- [ ] BACKLOG.md updated (items marked done)
- [ ] Review doc created (if significant PR)
- [ ] Feature specs updated (if applicable)
- [ ] Next priority identified

---

## 🆘 Troubleshooting

### "Codex skipped steps in implementation guide"
→ Provide more specific prompt with checklist:
```
Implement PR #X step-by-step:
1. [Step 1 from guide]
2. [Step 2 from guide]
...
Mark each step complete in PR description.
```

### "Claude review is too nice, not critical enough"
→ Use explicit critical review prompt:
```
Review PR #X with CRITICAL eye.

Find problems:
- Security vulnerabilities
- Performance issues
- Edge cases not handled
- Missing tests
- Code quality issues

Rate harshly. Only ≥9/10 if truly outstanding.
```

### "Docs are out of sync"
→ Run doc sync prompt:
```
Audit all docs for consistency:
1. Check PROGRESS.md matches BACKLOG.md
2. Verify completed PRs are archived
3. Ensure feature specs reflect implementation
4. Fix any discrepancies
5. Update "Last Updated" dates
```

---

## 📞 Quick Reference

| Task | Run This |
|------|----------|
| Start new PR | Codex: "Implement next PR from PROGRESS.md" |
| Review PR | Claude: "Review PR #X with detailed feedback" |
| Update docs after merge | Claude: "Update docs for merged PR #X" |
| Emergency fix | Codex: "EMERGENCY: Fix [issue]" |
| Sync docs | Claude: "Audit docs for consistency" |

---

**Last Updated:** 2026-01-05
**Maintained By:** Human Team
**Version:** 1.0

**Questions?** See [README.md](./README.md) for navigation or [PROGRESS.md](./PROGRESS.md) for current status.

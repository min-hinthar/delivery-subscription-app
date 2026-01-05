# Claude + Codex Collaboration Quick Reference

**Purpose:** Quick reference for dual-agent professional collaboration
**Full Details:** See AGENTS.md Section 16 and CODEX_WORKFLOW.md

---

## 🎯 Workflow Overview

**Standard Development Cycle:**
1. Claude creates plans, architecture, designs → Pushes to `claude/*` branch
2. User reviews and merges Claude's work to `main`
3. Codex pulls `main` → Implements features → Pushes to `codex/*` branch
4. User reviews and merges Codex's work to `main`
5. Repeat

**Key Principle:** Codex ALWAYS works from `main` branch, not Claude branches.

---

## 📋 For Codex: Review Checklist

When Claude's work has been merged to main and you're implementing the next feature:

### Before Starting
- [ ] Read `docs/CLAUDE_CODEX_HANDOFF.md` - Latest session summary
- [ ] Read relevant spec from `docs/PR_PROMPTS_NEXT_SESSIONS.md`
- [ ] Review Claude's planning docs if applicable
- [ ] Run `pnpm test` to verify baseline

### During Development
- [ ] Follow all standards in `AGENTS.md`
- [ ] Write comprehensive tests (target 80%+ coverage)
- [ ] Ensure TypeScript strict mode compliance
- [ ] Test mobile responsiveness
- [ ] Verify dark mode support
- [ ] Check accessibility (WCAG AA minimum)

### Before Committing
```bash
pnpm test                # All tests must pass
pnpm run typecheck       # No TypeScript errors
bash scripts/codex/verify.sh  # Full verification
```

### After Completing Work
- [ ] Update `docs/CLAUDE_CODEX_HANDOFF.md` with session summary
- [ ] Document what was implemented
- [ ] Note any issues encountered
- [ ] Suggest improvements for Claude's next session
- [ ] Commit with clear, detailed message
- [ ] Push to `codex/*` branch

---

## 📁 Key Documents

### Always Check These
1. **`docs/CLAUDE_CODEX_HANDOFF.md`** - Session summaries and latest status
2. **`CODEX_WORKFLOW.md`** - Complete Codex workflow guide
3. **`AGENTS.md` Section 16** - Collaboration rules and responsibilities

### Planning Documents (Claude Creates)
- `docs/UI_UX_REVAMP_PLAN.md` - Complete UI/UX redesign specifications
- `docs/GOOGLE_MAPS_ARCHITECTURE.md` - Maps integration architecture
- `docs/PR_PROMPTS_NEXT_SESSIONS.md` - Feature specifications with acceptance criteria
- `docs/TESTING_STRATEGY.md` - Testing approach and patterns

### Standards (Both Agents Follow)
- `docs/BLUEPRINT.md` - Product requirements and architecture
- `docs/SECURITY_QA.md` - Security standards and checklist
- `docs/NEXTJS16_ROUTING_STANDARDS.md` - Next.js routing patterns
- `docs/QA_UX.md` - UX requirements and testing

---

## 💬 Communication Protocol

### After Each Claude Session
Claude documents in `docs/CLAUDE_CODEX_HANDOFF.md`:
- What was planned/designed
- Implementation notes for Codex
- Acceptance criteria
- Files to review
- Open questions

### After Each Codex Session
Codex adds to `docs/CLAUDE_CODEX_HANDOFF.md`:
- What was implemented
- Test coverage achieved
- Issues encountered
- Suggestions for Claude's next session

---

## 🎯 Quality Standards

**Both agents must maintain:**
- Test Coverage: 80%+
- TypeScript: Zero `any` types
- Accessibility: WCAG AA minimum
- Performance: Lighthouse 90+
- Bundle Size: <200KB initial load
- All tests passing before commits
- Clear, detailed commit messages

---

## 🆘 Troubleshooting

### Tests Failing
```bash
pnpm test
# Check docs/CLAUDE_CODEX_HANDOFF.md for known issues
```

### Build Errors
```bash
bash scripts/codex/verify.sh
pnpm run typecheck
```

### Git Issues
```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b codex/[feature-name]
```

---

## ✅ Success Criteria

**Good Collaboration:**
- ✅ Clear communication through handoff docs
- ✅ Comprehensive tests for all changes
- ✅ All quality gates passing before commits
- ✅ Documentation always up to date
- ✅ Professional, constructive feedback
- ✅ Proper git workflow

**Standards to Avoid:**
- ❌ Skipping handoff document updates
- ❌ Committing without testing
- ❌ Ignoring standards in AGENTS.md
- ❌ Undocumented changes
- ❌ TypeScript errors or `any` types
- ❌ Failing tests in commits

---

**Questions?** Check `AGENTS.md` Section 16 for full collaboration rules or `CODEX_WORKFLOW.md` for complete workflow guide.

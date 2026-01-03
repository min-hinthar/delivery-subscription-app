# 🎯 Codex Workflow - Professional Collaboration

**Your Role:** Senior full-stack developer - implement features from main branch
**Claude's Role:** Planning, architecture, frontend design, code review
**Workflow:** Claude plans → User merges to main → You implement from main

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

### 4. Build, Test, Commit
```bash
# Work on feature
pnpm dev
pnpm test

# Before committing
bash scripts/codex/verify.sh

# Commit
git add -A
git commit -m "feat: [feature-name]

[Details]"

# Push
git push -u origin codex/[feature-name]
```

### 5. Update Handoff Doc
Add your session to `docs/CLAUDE_CODEX_HANDOFF.md`:
```markdown
## Codex Session - [Feature Name]
**Date:** [date]
**Branch:** codex/[branch-name]

### Implemented
- [What you built]

### Notes for Claude
- [Any questions or suggestions]

### Ready for Review
- [ ] All tests passing
- [ ] Build verified
- [ ] Ready to merge to main
```

---

## 📚 Documents You Need

### Core Rules
- **`AGENTS.md`** - All coding standards and rules

### What To Build
- **`docs/PR_PROMPTS_NEXT_SESSIONS.md`** - Detailed feature specs
- **`docs/UI_UX_REVAMP_PLAN.md`** - UI/UX designs
- **`docs/GOOGLE_MAPS_ARCHITECTURE.md`** - Maps integration plan

### Standards
- **`docs/BLUEPRINT.md`** - Product requirements
- **`docs/NEXTJS16_ROUTING_STANDARDS.md`** - Routing patterns
- **`docs/SECURITY_QA.md`** - Security requirements
- **`docs/QA_UX.md`** - UX requirements

### Collaboration
- **`docs/CLAUDE_CODEX_HANDOFF.md`** - Session log and handoffs

---

## 🔄 Professional Workflow

### Claude's Responsibilities
- Create comprehensive plans and architecture docs
- Design UI/UX and frontend patterns
- Review your PRs and provide feedback
- Update planning docs with next tasks

### Your Responsibilities
- Implement features from plans
- Write tests for your code
- Follow all standards in AGENTS.md
- Update handoff doc after each session
- Merge to main when ready (or ask user)

### Workflow Cycle
```
1. Claude: Creates plan → Pushes to claude/* branch
2. User: Reviews → Merges to main
3. You (Codex): Pulls main → Implements → Pushes to codex/* branch
4. User: Reviews → Merges to main
5. Repeat
```

---

## ✅ Before Every Commit

```bash
# Run all checks
pnpm test
pnpm run typecheck
bash scripts/codex/verify.sh
```

All must pass before committing.

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

---

## 📋 Current Tasks

Check `docs/CLAUDE_CODEX_HANDOFF.md` for latest.

**General Process:**
1. Start from main
2. Build feature
3. Update handoff doc
4. Push for review
5. Repeat

---

**That's it. Keep it simple, professional, and focused on delivering quality code.**

# Contributing Guide

**Welcome! This guide will help you contribute effectively to the Mandalay Morning Star delivery app.**

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Testing Requirements](#testing-requirements)
5. [PR Guidelines](#pr-guidelines)
6. [Codex/Claude Collaboration](#codexclaude-collaboration)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (via Corepack)
- Supabase account
- Stripe account (test mode)
- Google Cloud project (Maps APIs enabled)

### Setup

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

---

## 🔄 Development Workflow

### For Human Contributors

1. **Check what's needed:**
   - Read [docs/PROGRESS.md](docs/PROGRESS.md)
   - Check [docs/01-active/BACKLOG.md](docs/01-active/BACKLOG.md)

2. **Create feature branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

3. **Develop:**
   - Write code following standards below
   - Write tests for new functionality
   - Ensure `pnpm build` and `pnpm test` pass

4. **Commit:**
   ```bash
   git add .
   git commit -m "feat: description of feature"
   git push -u origin feature/your-feature-name
   ```

5. **Create PR:**
   - Use PR template
   - Link to related issues/backlog items
   - Request review

### For Codex (Autonomous Agent)

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for complete Codex workflow with copy-paste prompts.

**Quick version:**
1. Read `docs/PROGRESS.md` for next priority
2. Read implementation guide in `docs/01-active/implementation-guides/`
3. Implement following the guide
4. Update `docs/PROGRESS.md`
5. Create detailed PR

### For Claude (Code Review)

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for complete Claude workflow.

**Quick version:**
1. Review PR created by Codex
2. Test manually and provide critical feedback
3. Score PR (X/10)
4. Update docs after merge

---

## 📏 Code Standards

### TypeScript

- **Strict mode:** Always enabled
- **Type safety:** No `any` types without justification
- **Imports:** Use absolute imports with `@/` prefix

### React/Next.js

- **App Router:** Use Next.js 14+ App Router patterns
- **Server Components:** Default to Server Components
- **Client Components:** Use `'use client'` only when needed
- **Route Handlers:** Follow Next.js API route patterns

### Styling

- **Tailwind CSS:** Primary styling method
- **shadcn/ui:** Use for UI components
- **Design tokens:** Follow `docs/03-architecture/blueprint.md`
- **Responsive:** Mobile-first design

### File Organization

```
src/
├── app/              # Next.js App Router pages
│   ├── (marketing)/  # Public pages
│   ├── (auth)/       # Auth pages
│   ├── (app)/        # Authenticated pages
│   └── api/          # API routes
├── components/       # React components
│   ├── ui/           # shadcn/ui components
│   ├── auth/         # Auth components
│   ├── admin/        # Admin components
│   └── driver/       # Driver components
└── lib/              # Utilities
    ├── supabase/     # Supabase clients
    ├── stripe/       # Stripe utilities
    └── maps/         # Google Maps utilities
```

---

## 🧪 Testing Requirements

### Unit Tests

- **Coverage:** Aim for >75% on new code
- **Framework:** Vitest
- **Location:** `__tests__` directories or `.test.ts` files

```bash
pnpm test
pnpm test:coverage
```

### Integration Tests

- **API routes:** Test all endpoints
- **Database:** Test RLS policies
- **Validation:** Test Zod schemas

### E2E Tests

- **Framework:** Playwright
- **Critical paths:** Test all user journeys
- **Location:** `tests/e2e/`

```bash
pnpm test:e2e
```

### Test Checklist

Before submitting PR:
- [ ] Unit tests for new functions
- [ ] Integration tests for new API routes
- [ ] E2E tests for new user flows
- [ ] All tests passing
- [ ] No console errors/warnings

---

## 📝 PR Guidelines

### PR Title Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add weekly menu system
fix: resolve driver auth redirect loop
docs: update API documentation
test: add E2E tests for tracking
refactor: simplify route optimization logic
perf: optimize database queries
style: update button component styling
chore: update dependencies
```

### PR Description Template

Use `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Summary
Brief description of changes and why they're needed.

## Related
- Closes #[issue]
- Part of [docs/01-active/BACKLOG.md] item

## Changes
- Added: [list]
- Changed: [list]
- Fixed: [list]

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Mobile tested

## Screenshots
[Before/after screenshots if UI changes]

## Checklist
- [ ] Code follows standards
- [ ] Tests added/updated
- [ ] Docs updated
- [ ] No secrets committed
- [ ] Build passes
```

### PR Size

- **Small PRs:** Preferred (<500 lines)
- **Large PRs:** Break into smaller PRs when possible
- **Max size:** <1000 lines (unless unavoidable)

### Review Process

1. **Automated checks:**
   - Build must pass
   - Tests must pass
   - Linting must pass

2. **Code review:**
   - At least 1 approval required
   - Address all feedback
   - No unresolved conversations

3. **Merge:**
   - Squash and merge (keep history clean)
   - Delete branch after merge

---

## 🤝 Codex/Claude Collaboration

This project uses autonomous agents (Codex and Claude) alongside human developers.

### Workflow Rules

1. **Codex implements** features following implementation guides
2. **Claude reviews** PRs with critical feedback and scores
3. **Human coordinates** and makes final merge decisions
4. **Docs update** after every PR (see [docs/WORKFLOW.md](docs/WORKFLOW.md))

### Collaboration Best Practices

**For Codex:**
- ✅ Follow implementation guides precisely
- ✅ Update PROGRESS.md when starting/finishing
- ✅ Create comprehensive PR descriptions
- ✅ Test thoroughly before submitting
- ❌ Don't skip steps in guides
- ❌ Don't commit without testing

**For Claude:**
- ✅ Be critical, not just nice
- ✅ Test manually, don't just read code
- ✅ Provide specific, actionable feedback
- ✅ Update docs after merge
- ❌ Don't rubber-stamp PRs
- ❌ Don't approve without testing

**For Humans:**
- ✅ Run Codex for implementation
- ✅ Run Claude for review
- ✅ Make final merge decisions
- ✅ Keep docs updated
- ❌ Don't skip agent reviews
- ❌ Don't let docs get stale

**Full workflow:** [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## 🔒 Security

### Critical Rules

- **No secrets in code:** Use environment variables
- **RLS policies:** All database tables must have RLS
- **Input validation:** Validate all user input (Zod)
- **API security:** Rate limiting on all endpoints
- **Auth checks:** Verify user permissions
- **Webhook signatures:** Validate all webhook signatures

### Security Checklist

Before merging:
- [ ] No hardcoded secrets
- [ ] RLS policies tested
- [ ] Input validation present
- [ ] Auth checks in place
- [ ] Rate limiting configured
- [ ] HTTPS only
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities

**Security docs:** [docs/04-security/](docs/04-security/)

---

## 📊 Performance

### Requirements

- **Lighthouse score:** >90 (all categories)
- **Time to Interactive:** <3s
- **First Contentful Paint:** <1.5s
- **Bundle size:** <300KB initial load

### Best Practices

- Use dynamic imports for large components
- Optimize images (WebP, lazy loading)
- Minimize bundle size
- Cache API responses
- Use server components when possible

---

## 📚 Documentation

### When to Update Docs

- **After every PR:** Update PROGRESS.md and BACKLOG.md
- **New features:** Add to feature specs
- **Architecture changes:** Update architecture docs
- **API changes:** Update API documentation

### Doc Structure

See [docs/README.md](docs/README.md) for complete documentation structure.

---

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Verify on latest `main` branch
3. Try to reproduce

### Bug Report Template

```markdown
## Bug Description
[Clear description]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 20.10]

## Screenshots
[If applicable]
```

---

## 💡 Feature Requests

### Before Requesting

1. Check [docs/PROGRESS.md](docs/PROGRESS.md) and [docs/02-planning/](docs/02-planning/)
2. Verify not already planned
3. Consider if it fits project scope

### Feature Request Template

```markdown
## Feature Description
[Clear description]

## Use Case
[Why is this needed?]

## Proposed Solution
[How should it work?]

## Alternatives
[Other approaches considered]
```

---

## 📞 Getting Help

- **Documentation:** [docs/README.md](docs/README.md)
- **Workflow:** [docs/WORKFLOW.md](docs/WORKFLOW.md)
- **Architecture:** [docs/03-architecture/](docs/03-architecture/)
- **Main workflow:** [AGENTS.md](AGENTS.md)

---

## 📄 License

Proprietary - Mandalay Morning Star (unless otherwise specified)

---

**Ready to contribute?** Check [docs/PROGRESS.md](docs/PROGRESS.md) for what to work on next!

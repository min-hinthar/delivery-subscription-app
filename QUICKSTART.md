# ⚡ Quick Start Guide

**Get up and running in 5 minutes!**

---

## 🎯 For Developers

### First Time Setup

```bash
# 1. Install dependencies
corepack enable
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run database migrations
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 4. Start development server
pnpm dev
```

**App running at:** http://localhost:3000

### Key Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm test:e2e     # Run E2E tests
pnpm lint         # Lint code
pnpm format       # Format code
```

---

## 🤖 For Codex (Autonomous Development)

### Start Here Every Session

1. **Check what's next:**
   ```bash
   cat docs/PROGRESS.md
   ```

2. **Read the workflow:**
   ```bash
   cat docs/WORKFLOW.md
   ```

3. **Implement next PR:**
   - Follow implementation guide in `docs/01-active/implementation-guides/`
   - Update `docs/PROGRESS.md` when starting
   - Create detailed PR when done

**Full guide:** [docs/07-workflow/codex-playbook.md](docs/07-workflow/codex-playbook.md)

---

## 🧠 For Claude (Code Review & Planning)

### After Codex Completes PR

1. **Review the PR:**
   ```
   Review PR #[NUMBER] following docs/WORKFLOW.md checklist.
   Be critical, test thoroughly, provide score.
   ```

2. **Update docs after merge:**
   ```
   Update docs/PROGRESS.md and docs/01-active/BACKLOG.md
   for merged PR #[NUMBER].
   ```

**Full workflow:** [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## 📚 Documentation

All documentation is in `docs/`:

| What You Need | Where to Find It |
|---------------|------------------|
| **What's next?** | [docs/PROGRESS.md](docs/PROGRESS.md) |
| **How to run Codex/Claude?** | [docs/WORKFLOW.md](docs/WORKFLOW.md) |
| **Implementation guides** | [docs/01-active/implementation-guides/](docs/01-active/implementation-guides/) |
| **Feature specs** | [docs/02-planning/feature-specs/](docs/02-planning/feature-specs/) |
| **Architecture** | [docs/03-architecture/](docs/03-architecture/) |
| **Security** | [docs/04-security/](docs/04-security/) |
| **Testing** | [docs/05-testing/](docs/05-testing/) |
| **Full navigation** | [docs/README.md](docs/README.md) |

---

## 🔑 Environment Variables

Required variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Maps
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
```

See `.env.example` for complete list.

---

## 🚀 Project Status

**Completion:** 95% Production-Ready ✅

**Completed:**
- ✅ Customer onboarding & scheduling
- ✅ Admin route builder & management
- ✅ Driver authentication & tracking
- ✅ Live delivery tracking
- ✅ Google Maps integration

**Next Up:**
- Mobile UX enhancement (PR #24)
- Weekly menu system (PR #25)
- Burmese language support (PR #26)

See [docs/PROGRESS.md](docs/PROGRESS.md) for details.

---

## 🤝 Contributing

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Read [AGENTS.md](AGENTS.md) for workflow
3. Follow [docs/WORKFLOW.md](docs/WORKFLOW.md) for PR process

---

## 📞 Need Help?

- **Documentation:** [docs/README.md](docs/README.md)
- **Main README:** [README.md](README.md)
- **Codex Guide:** [docs/07-workflow/codex-playbook.md](docs/07-workflow/codex-playbook.md)
- **Workflow:** [AGENTS.md](AGENTS.md)

---

**Ready to build?** Check [docs/PROGRESS.md](docs/PROGRESS.md) for the next task!

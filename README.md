# Mandalay Morning Star — Burmese Meal Delivery Platform

**Production-grade weekly meal delivery subscription + real-time tracking app for Mandalay Morning Star Burmese Kitchen.**

Customers subscribe to weekly meal plans, schedule delivery windows, and track deliveries in real-time. Admins manage routes, assign drivers, and optimize delivery operations. Drivers use mobile app for route tracking and proof of delivery.

Built with **Next.js 14 (App Router)**, **Supabase (Auth + Postgres + RLS)**, **Stripe**, **Google Maps**, **Tailwind + shadcn/ui**, and **Framer Motion**.

---

## 🚀 Quick Start

**Get running in 5 minutes:** [QUICKSTART.md](QUICKSTART.md)

```bash
# 1. Install
corepack enable && pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Setup database
supabase link --project-ref YOUR_REF
supabase db push

# 4. Run
pnpm dev
```

---

## 📚 Documentation

All documentation is organized in [`docs/`](docs/):

| What You Need | Where to Find It |
|---------------|------------------|
| **📊 Project status & next tasks** | [docs/PROGRESS.md](docs/PROGRESS.md) |
| **🔄 Codex/Claude workflow** | [docs/WORKFLOW.md](docs/WORKFLOW.md) |
| **📖 Full documentation nav** | [docs/README.md](docs/README.md) |
| **🎯 Implementation guides** | [docs/01-active/implementation-guides/](docs/01-active/implementation-guides/) |
| **🗺️ Production roadmap** | [docs/02-planning/production-roadmap.md](docs/02-planning/production-roadmap.md) |
| **🏗️ Architecture** | [docs/03-architecture/](docs/03-architecture/) |
| **🔒 Security** | [docs/04-security/](docs/04-security/) |
| **🧪 Testing** | [docs/05-testing/](docs/05-testing/) |

---

## ✨ Features

### 👤 Customer Experience
- ✅ Supabase Auth (email/password + magic link)
- ✅ Profile onboarding with address validation
- ✅ Weekly subscription management (Stripe)
- ✅ Visual calendar delivery scheduling
- ✅ Real-time delivery tracking with animated map
- ✅ ETA updates and delivery notifications
- ✅ Browser notifications with proof of delivery photos

### 👨‍💼 Admin Operations
- ✅ Visual drag-and-drop route builder
- ✅ Google Maps route optimization
- ✅ Driver management and assignment
- ✅ Bulk delivery operations
- ✅ Search and filter capabilities
- ✅ Delivery manifest export (PDF/CSV)
- ✅ Weekly menu management

### 🚗 Driver Mobile App
- ✅ Driver authentication and onboarding
- ✅ Route dashboard with assigned deliveries
- ✅ Real-time GPS location tracking
- ✅ Offline queue for network interruptions
- ✅ Stop management with proof of delivery
- ✅ Photo upload and delivery notes

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API Routes, Supabase (Postgres + Auth + RLS)
- **Payments:** Stripe (Subscriptions + Webhooks)
- **Maps:** Google Maps Platform (Geocoding + Directions + Maps JS)
- **Testing:** Vitest (unit), Playwright (E2E)
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

---

## 📊 Project Status

**Completion:** 95% Production-Ready ✅

**Completed (13 Major PRs):**
- ✅ Design system 2.0 foundation
- ✅ Customer onboarding & scheduling
- ✅ Admin dashboard & bulk operations
- ✅ Google Maps integration (foundation + tracking + routing)
- ✅ Visual route builder with optimization
- ✅ Live delivery tracking with animations
- ✅ Driver authentication & management
- ✅ Driver mobile app with offline support

**In Progress:**
- 🟡 Mobile UX enhancement (PR #24)
- 🟡 Weekly menu system (PR #25)
- 🟡 Burmese language support (PR #26)

See [docs/PROGRESS.md](docs/PROGRESS.md) for details.

---

## 🏗️ Project Structure

```
delivery-subscription-app/
├── .github/                 # GitHub templates
├── docs/                    # 📚 All documentation
│   ├── README.md            # Documentation hub
│   ├── PROGRESS.md          # Project tracking
│   ├── WORKFLOW.md          # Codex/Claude prompts
│   ├── 01-active/           # Current work
│   ├── 02-planning/         # Roadmaps & specs
│   ├── 03-architecture/     # System design
│   ├── 04-security/         # Security docs
│   ├── 05-testing/          # Testing guides
│   ├── 06-operations/       # Operations
│   ├── 07-workflow/         # Team workflow
│   └── 08-archive/          # Completed work
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (marketing)/     # Public pages
│   │   ├── (auth)/          # Auth pages
│   │   ├── (app)/           # Customer pages
│   │   ├── (admin)/         # Admin pages
│   │   ├── (driver)/        # Driver pages
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── auth/            # Auth components
│   │   ├── admin/           # Admin components
│   │   ├── driver/          # Driver components
│   │   └── track/           # Tracking components
│   └── lib/                 # Utilities
│       ├── supabase/        # Supabase clients
│       ├── stripe/          # Stripe utilities
│       ├── maps/            # Google Maps utilities
│       └── auth/            # Auth helpers
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Seed data
├── tests/
│   ├── e2e/                 # Playwright E2E tests
│   └── performance/         # Performance tests
├── scripts/                 # Build/dev scripts
└── public/                  # Static assets
```

---

## 🤝 Contributing

We use a unique **Claude + Codex collaboration workflow** for development:

1. **Codex** implements features following guides
2. **Claude** reviews PRs with critical feedback
3. **Human** coordinates and makes final decisions

**For contributors:** Read [CONTRIBUTING.md](CONTRIBUTING.md)

**For Codex:** Read [docs/WORKFLOW.md](docs/WORKFLOW.md) for copy-paste prompts

**For Claude:** Read [docs/WORKFLOW.md](docs/WORKFLOW.md) for review checklist

**Main workflow:** [AGENTS.md](AGENTS.md)

---

## 🔑 Environment Variables

Create `.env.local` from `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_WEEKLY=

# Google Maps
GOOGLE_MAPS_API_KEY=              # Server-side
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=  # Client-side
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=   # Map styling

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

See `.env.example` for complete list with descriptions.

---

## 🧪 Testing

```bash
# Unit tests
pnpm test
pnpm test:watch
pnpm test:coverage

# E2E tests
pnpm test:e2e
pnpm test:e2e:ui

# Linting & formatting
pnpm lint
pnpm format

# Type checking
pnpm typecheck

# Build
pnpm build
```

**Testing guide:** [docs/05-testing/comprehensive-guide.md](docs/05-testing/comprehensive-guide.md)

---

## 🚢 Deployment

### Vercel (Recommended)

1. Import repo to Vercel
2. Set environment variables
3. Deploy

**Automatic deployments** on push to `main`.

### Environment-Specific Setup

**Development:**
- Use Supabase CLI: `supabase link`
- Use Stripe test mode
- Run local: `pnpm dev`

**Production:**
- Configure production Supabase project
- Set production Stripe keys
- Add production webhook endpoints
- Configure Google Maps API restrictions

**Deployment guide:** [docs/02-planning/production-roadmap.md](docs/02-planning/production-roadmap.md)

---

## 📖 Key Documentation

| Document | Purpose |
|----------|---------|
| [QUICKSTART.md](QUICKSTART.md) | Get started in 5 minutes |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [AGENTS.md](AGENTS.md) | Main workflow guide |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Project status & tracking |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Codex/Claude prompts |
| [docs/README.md](docs/README.md) | Documentation hub |

---

## 🎯 For Autonomous Agents

### For Codex (Implementation)

**Start every session:**
```bash
cat docs/PROGRESS.md  # See what's next
cat docs/WORKFLOW.md  # Get implementation prompt
```

**Full guide:** [docs/07-workflow/codex-playbook.md](docs/07-workflow/codex-playbook.md)

### For Claude (Review)

**After Codex PR:**
```
Review PR #[NUMBER] following docs/WORKFLOW.md checklist.
Provide critical feedback and score.
```

**Full workflow:** [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## 🛡️ Security

- ✅ Supabase Row Level Security (RLS) on all tables
- ✅ Input validation with Zod schemas
- ✅ Rate limiting on API endpoints
- ✅ Stripe webhook signature verification
- ✅ Google Maps API key restrictions
- ✅ Environment variable validation
- ✅ HTTPS-only in production

**Security docs:** [docs/04-security/](docs/04-security/)

---

## 📊 Performance

- ✅ Lighthouse score >90 (all categories)
- ✅ Server Components by default
- ✅ Optimized images (WebP, lazy loading)
- ✅ Code splitting for admin/driver routes
- ✅ API response caching
- ✅ Database query optimization

**Performance guide:** [docs/02-planning/production-roadmap.md](docs/02-planning/production-roadmap.md#performance-optimization)

---

## 🌟 Roadmap

See [docs/PROGRESS.md](docs/PROGRESS.md) for detailed roadmap.

**Next Up (Weeks 1-2):**
- Mobile UX enhancement
- Weekly menu system
- Burmese language support

**Future (Months 2-3):**
- Customer analytics dashboard
- Advanced route optimization
- Push notifications
- Native mobile app (React Native)

---

## 📞 Support

- **Documentation:** [docs/README.md](docs/README.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues:** [GitHub Issues](https://github.com/min-hinthar/delivery-subscription-app/issues)

---

## 📄 License

Proprietary - Mandalay Morning Star

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Stripe](https://stripe.com/) - Payment processing
- [Google Maps Platform](https://developers.google.com/maps) - Mapping services
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Ready to start?** → [QUICKSTART.md](QUICKSTART.md)

**For Codex:** → [docs/WORKFLOW.md](docs/WORKFLOW.md)

**For Humans:** → [CONTRIBUTING.md](CONTRIBUTING.md)

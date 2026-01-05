# Claude + Codex Integration Plan — Team Workflows

**Mission:** Leverage Claude Code CLI's deep analysis, critical review, and research capabilities to enhance the Codex-driven development workflow for Mandalay Morning Star delivery app.

---

## **🎯 Core Principle: Tool Strengths**

### **Codex Best For:**
- ✅ Rapid implementation of well-defined features
- ✅ Quick fixes and iterations
- ✅ Following established patterns in AGENTS.md
- ✅ Executing against BACKLOG.md items
- ✅ UI component scaffolding

### **Claude Best For:**
- ✅ **Deep codebase analysis** - Understanding architecture, finding patterns
- ✅ **Critical code review** - Security, performance, accessibility audits
- ✅ **Research** - Latest best practices, library updates, vulnerability checks
- ✅ **Planning** - Complex refactoring strategies, architecture decisions
- ✅ **Documentation** - Generating comprehensive guides, ADRs
- ✅ **Testing strategy** - Test suite design, coverage analysis
- ✅ **Dependency analysis** - Outdated packages, security advisories

---

## **🏆 Competitive Collaboration Philosophy**

**This project uses a friendly competition model between Claude and Codex to drive excellence.**

### Why Competition Works
- ✅ Pushes both agents to deliver their absolute best work
- ✅ Creates measurable benchmarks for objective success
- ✅ Encourages proactive improvements, not just passive reviews
- ✅ Makes collaboration more engaging and effective
- ✅ User wins by getting exceptional output from both agents

### Key Competitive Principles
1. **Challenge Everything** - Both agents question assumptions and propose alternatives
2. **Compete on Metrics** - Test coverage, performance, accessibility, bundle size
3. **Improve Before Merging** - Codex enhances Claude's work before accepting it
4. **Set New Challenges** - Each session raises the bar for the next
5. **Learn and Adapt** - Both agents learn from each other's strengths
6. **No Rubber-Stamping** - Approval without improvement is failure

### Success Metrics (Both Agents Compete)
- Test Coverage: Target >80% (currently ~60%)
- TypeScript Strictness: Zero `any` types
- Accessibility: WCAG AAA (currently AA)
- Performance: Lighthouse 90+ (not yet measured)
- Bundle Size: <180KB initial load (not yet measured)
- Each session measurably better than the last

**See AGENTS.md Section 16 for full competitive collaboration rules and current scorecard.**

---

## **🔄 Git Workflow for Dual-Agent Collaboration**

### **For Codex: Working with Claude Branches**

**CRITICAL: Read AGENTS.md Section 16 for full details**

When Claude completes a session and pushes to a `claude/*` branch, Codex must:

#### Step 1: Fetch the Claude branch
```bash
git fetch origin claude/plan-claude-integration-2tdsK
```

#### Step 2: Checkout with tracking (REQUIRED)
```bash
git checkout -b claude/plan-claude-integration-2tdsK origin/claude/plan-claude-integration-2tdsK
```

**Important:** The `-b` and `origin/` prefix are required to set up tracking. Without this, `git pull` will fail.

#### Step 3: Pull latest changes
```bash
git pull
```

#### Step 4: Review and test
```bash
pnpm dev
pnpm test
bash scripts/codex/verify.sh
```

### **Common Git Issues**

**Problem:** `git pull` fails with "no tracking information"
**Solution:**
```bash
git branch --set-upstream-to=origin/claude/plan-claude-integration-2tdsK
git pull
```

**Problem:** Not sure which Claude branch to review
**Solution:**
```bash
git branch -r | grep claude
# Check docs/CLAUDE_CODEX_HANDOFF.md for latest branch name
```

### **Handoff Documents to Check**

Before reviewing, always read:
1. `docs/CLAUDE_CODEX_HANDOFF.md` - Latest session summary
2. `docs/PR_PROMPTS_NEXT_SESSIONS.md` - What's planned next
3. Git commit messages on the Claude branch

---

## **Phase 1: Initial Codebase Analysis** 📊

### 1.1 Dependency & Security Audit
**Claude Actions:**
- [x] Analyze package.json dependencies
- [ ] Use Web Search to find security vulnerabilities in current versions
- [ ] Check for outdated packages (React 19, Next.js 16, Supabase, Stripe)
- [ ] Generate upgrade priority matrix
- [ ] Document breaking changes and migration paths

**Output:** `docs/DEPENDENCY_AUDIT.md`

### 1.2 Code Quality Metrics
**Claude Actions:**
- [ ] Analyze TypeScript strictness (any types, missing types)
- [ ] Review component patterns (server vs client usage)
- [ ] Audit error handling consistency
- [ ] Check accessibility compliance (WCAG 2.1)
- [ ] Measure bundle size potential optimizations

**Output:** `docs/CODE_QUALITY_REPORT.md`

### 1.3 Database Schema Analysis
**Claude Actions:**
- [ ] Analyze Supabase migrations for optimization opportunities
- [ ] Review RLS policies for completeness
- [ ] Identify missing indexes
- [ ] Check for N+1 query patterns
- [ ] Suggest caching strategies

**Output:** `docs/DATABASE_OPTIMIZATION.md`

### 1.4 API Route Review
**Claude Actions:**
- [ ] Audit all route handlers for security (input validation, auth checks)
- [ ] Review error handling and logging patterns
- [ ] Check for rate limiting gaps
- [ ] Validate Stripe webhook security
- [ ] Generate API documentation with examples

**Output:** `docs/API_SECURITY_AUDIT.md`

---

## **Phase 2: Critical Code Review Workflow** 🔍

### 2.1 Pre-PR Review Process
**When:** Before Codex creates a PR

**Claude Workflow:**
1. **Review changed files** against AGENTS.md standards
2. **Check security** - No secrets, proper auth gates, input validation
3. **Verify accessibility** - ARIA labels, keyboard nav, contrast
4. **Test edge cases** - Error states, loading states, empty states
5. **Mobile responsiveness** - Breakpoint checks, touch targets
6. **Performance** - Bundle impact, unnecessary re-renders
7. **Documentation** - Does PR update relevant docs?

**Output:** Inline comments + `REVIEW_CHECKLIST.md` for each PR

### 2.2 Post-Merge Analysis
**When:** After PR merged to main

**Claude Workflow:**
1. Analyze cumulative changes weekly
2. Track code quality trends
3. Identify emerging patterns (good or bad)
4. Suggest refactoring opportunities
5. Update architectural documentation

**Output:** Weekly `docs/WEEKLY_REVIEW_[DATE].md`

---

## **Phase 3: Architecture & Planning** 🏗️

### 3.1 Complex Feature Planning
**When:** New major features in BACKLOG.md need design

**Claude Workflow:**
1. **Research** - Web search for latest patterns (e.g., "Next.js 16 real-time updates 2026")
2. **Analyze** - Review existing codebase patterns
3. **Design** - Create step-by-step implementation plan
4. **Document** - Write ADR (Architecture Decision Record)
5. **Present** - Provide options with trade-offs for user decision

**Example Features:**
- Real-time delivery tracking (WebSockets vs Server-Sent Events vs polling)
- Advanced analytics dashboard
- Mobile app integration
- Multi-restaurant support

**Output:** `docs/ADR_[FEATURE_NAME].md`

### 3.2 Refactoring Strategies
**When:** Technical debt needs addressing

**Claude Workflow:**
1. Identify patterns across codebase
2. Suggest consolidation opportunities
3. Plan incremental refactoring path
4. Ensure backward compatibility
5. Create migration checklist

**Output:** `docs/REFACTOR_PLAN_[AREA].md`

---

## **Phase 4: Testing & Quality Assurance** ✅

### 4.1 Test Suite Design
**Current State:** No automated tests (per QA_UX_REPORT.md)

**Claude Actions:**
- [ ] Research best testing libraries for Next.js 16 (2026 best practices)
- [ ] Design test strategy:
  - Unit tests (Vitest/Jest)
  - Component tests (React Testing Library)
  - Integration tests (Playwright)
  - E2E tests (Playwright)
- [ ] Create test templates and examples
- [ ] Set up test infrastructure (config, CI integration)
- [ ] Generate test coverage roadmap

**Output:** `docs/TESTING_STRATEGY.md` + test scaffolding

### 4.2 Performance Testing
**Claude Actions:**
- [ ] Analyze build output for bundle size
- [ ] Identify code-splitting opportunities
- [ ] Review image optimization
- [ ] Check database query efficiency
- [ ] Create performance budget

**Output:** `docs/PERFORMANCE_AUDIT.md`

---

## **Phase 5: UI/UX Enhancement** 🎨

### 5.1 Accessibility Deep Dive
**Claude Actions:**
- [ ] Audit all components for WCAG 2.1 AA compliance
- [ ] Check keyboard navigation flows
- [ ] Review screen reader compatibility
- [ ] Test color contrast ratios
- [ ] Validate form error messaging
- [ ] Check focus management

**Output:** `docs/A11Y_AUDIT.md` with actionable fixes

### 5.2 Mobile UX Optimization
**Claude Actions:**
- [ ] Review touch target sizes (>=44px)
- [ ] Check mobile navigation patterns
- [ ] Validate responsive breakpoints
- [ ] Test gesture conflicts
- [ ] Review mobile-specific performance

**Output:** `docs/MOBILE_UX_IMPROVEMENTS.md`

### 5.3 Animation & Motion Review
**Claude Actions:**
- [ ] Audit Framer Motion usage
- [ ] Verify prefers-reduced-motion support
- [ ] Check animation performance
- [ ] Suggest subtle improvements
- [ ] Review loading transitions

**Output:** Direct code suggestions in PR reviews

---

## **Phase 6: Security Hardening** 🔒

### 6.1 Security Audit
**Claude Actions:**
- [ ] Review authentication flows (Supabase)
- [ ] Audit authorization checks (RLS policies)
- [ ] Check for OWASP Top 10 vulnerabilities
- [ ] Validate CSRF protection
- [ ] Review rate limiting
- [ ] Audit payment security (Stripe)
- [ ] Check for sensitive data exposure
- [ ] Review CSP headers

**Output:** `docs/SECURITY_AUDIT_CLAUDE.md`

### 6.2 Vulnerability Monitoring
**Ongoing:**
- Monthly web searches for CVEs in dependencies
- Review new security advisories
- Track Supabase/Stripe security updates

**Output:** Updates to `docs/SECURITY_BACKLOG.md`

---

## **Phase 7: Documentation & Knowledge** 📚

### 7.1 Comprehensive Documentation
**Claude Actions:**
- [ ] Generate API documentation from route handlers
- [ ] Create component library documentation
- [ ] Write deployment runbooks
- [ ] Document common workflows
- [ ] Create troubleshooting guides
- [ ] Generate onboarding guide for new developers

**Output:** `docs/DEVELOPER_GUIDE.md`, `docs/API_REFERENCE.md`

### 7.2 Living Architecture Documentation
**Claude Actions:**
- [ ] Create system architecture diagrams (as markdown/mermaid)
- [ ] Document data flow patterns
- [ ] Map authentication/authorization flows
- [ ] Document external integrations (Stripe, Google Maps, Supabase)
- [ ] Create decision tree for routing logic

**Output:** `docs/ARCHITECTURE.md` with diagrams

---

## **Phase 8: Advanced Features Research** 🌟

### 8.1 Real-time Updates
**Claude Research:**
- Web search: "Next.js 16 real-time updates best practices 2026"
- Compare: WebSockets vs SSE vs Supabase Realtime
- Analyze: Performance, scaling, cost implications
- Design: Implementation strategy

**Output:** `docs/REALTIME_IMPLEMENTATION_PLAN.md`

### 8.2 Analytics & Reporting
**Claude Research:**
- Research modern analytics patterns
- Evaluate privacy-first analytics
- Design custom dashboard architecture
- Plan data aggregation strategies

**Output:** `docs/ANALYTICS_DESIGN.md`

### 8.3 Notification System
**Claude Research:**
- Compare email providers (Resend, SendGrid, AWS SES)
- Research SMS integration (Twilio)
- Design notification templates
- Plan delivery scheduling

**Output:** `docs/NOTIFICATIONS_PLAN.md`

---

## **🔄 Weekly Workflow**

### **Monday: Planning & Review**
1. **Claude** reviews last week's merged PRs
2. **Claude** generates weekly quality report
3. **User + Claude** prioritize BACKLOG.md items
4. **Claude** provides research/planning for complex items

### **Tuesday-Thursday: Development**
1. **Codex** implements features from BACKLOG.md
2. **Claude** provides on-demand code reviews
3. **Claude** researches blockers (web search, docs)
4. **Claude** updates documentation as needed

### **Friday: Quality & Planning**
1. **Claude** runs comprehensive codebase analysis
2. **Claude** updates quality metrics
3. **Claude** prepares research for next week's features
4. **User** reviews Claude's recommendations

---

## **🛠️ Claude-Specific Scripts**

### Setup Scripts to Create:
```bash
# scripts/claude/analyze-bundle.sh - Bundle size analysis
# scripts/claude/check-deps.sh - Dependency vulnerability check
# scripts/claude/review-pr.sh - PR review automation
# scripts/claude/generate-docs.sh - Auto-generate documentation
# scripts/claude/audit-a11y.sh - Accessibility audit
# scripts/claude/quality-report.sh - Weekly quality metrics
```

---

## **📋 Code Review Checklist for Codex PRs**

### Security ✅
- [ ] No secrets or API keys committed
- [ ] Auth checks present on protected routes
- [ ] Input validation with Zod schemas
- [ ] RLS policies enforced
- [ ] Stripe webhook signature verified
- [ ] Rate limiting on expensive endpoints

### Code Quality ✅
- [ ] TypeScript types are specific (no `any`)
- [ ] Server/client components used correctly
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Empty states designed

### UX/Accessibility ✅
- [ ] Mobile responsive (tested at 375px, 768px, 1024px)
- [ ] Touch targets >=44px
- [ ] ARIA labels present
- [ ] Keyboard navigation works
- [ ] Color contrast passes WCAG AA
- [ ] Focus states visible
- [ ] prefers-reduced-motion respected

### Performance ✅
- [ ] Images optimized (next/image)
- [ ] No unnecessary client components
- [ ] Proper caching headers
- [ ] No N+1 queries
- [ ] Bundle size impact checked

### Documentation ✅
- [ ] BACKLOG.md item linked
- [ ] QA_UX.md updated if UX changed
- [ ] SECURITY_CHECKLIST.md updated if security changed
- [ ] PR description has testing steps
- [ ] Code comments for complex logic

---

## **🎯 Success Metrics**

Track monthly:
- **Code Quality**: TypeScript strict mode compliance, test coverage
- **Security**: Open vulnerabilities, security audit findings
- **Performance**: Bundle size, Lighthouse scores, API response times
- **Accessibility**: WCAG compliance %, keyboard nav coverage
- **Documentation**: Docs up-to-date %, coverage of features
- **Velocity**: PRs merged, features shipped, bugs fixed

---

## **🚀 Getting Started**

### Immediate Actions:
1. **User**: Review this plan and prioritize phases
2. **Claude**: Run Phase 1 analysis (dependency audit, code quality)
3. **Claude**: Create scripts in `scripts/claude/`
4. **Claude**: Generate initial audit reports
5. **User + Claude**: Establish weekly review cadence
6. **Codex**: Continue BACKLOG.md execution with Claude reviews

### First Week Goals:
- Complete dependency audit
- Set up code review workflow
- Create testing strategy
- Document current architecture
- Identify top 3 improvement areas

---

## **💡 Integration Tips**

1. **Use Claude for "Why"** - Research, analysis, strategy
2. **Use Codex for "How"** - Implementation, iteration, fixes
3. **Claude reviews before merge** - Catch issues early
4. **Claude documents after merge** - Keep knowledge current
5. **Both tools read AGENTS.md** - Consistent standards
6. **Weekly syncs** - Review progress, adjust priorities

---

**Last Updated:** 2026-01-03
**Status:** Initial plan - ready for execution
**Owner:** min-hinthar + Claude + Codex team

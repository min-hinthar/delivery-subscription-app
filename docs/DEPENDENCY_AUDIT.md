# Dependency Security Audit — January 2026

**Audit Date:** 2026-01-03
**Auditor:** Claude Code
**Risk Level:** 🔴 **CRITICAL** - Immediate action required

---

## 🚨 Critical Security Vulnerabilities

### ❌ CRITICAL: Next.js 16.1.1 - Unpatched Version

**Current Version:** `16.1.1`
**Status:** ⚠️ **VULNERABLE** - Not a stable release
**CVE:** CVE-2025-66478 (Next.js) + CVE-2025-55182 (React upstream)
**CVSS Score:** 10.0 (Critical)
**Impact:** Remote Code Execution (RCE) via React Server Components

#### Problem:
Your app is running Next.js 16.1.1, which is **NOT listed in the official patched versions**. The vulnerability affects:
- All Next.js 15.x and 16.x versions using App Router (which you are using)
- Allows unauthenticated remote code execution
- Affects React Server Components (RSC) protocol

#### Patched Versions:
- **16.0.7** (stable)
- **16.0.10** (latest stable for 16.0.x)
- **15.6.0-canary.58**
- **16.1.0-canary.12+**

#### Recommended Action:
```bash
# Immediate downgrade to latest stable
pnpm update next@16.0.10

# Or upgrade to latest stable 15.x
pnpm update next@15.6.0
```

#### References:
- [Security Advisory: CVE-2025-66478 | Next.js](https://nextjs.org/blog/CVE-2025-66478)
- [Next.js Security Update: December 11, 2025](https://nextjs.org/blog/security-update-2025-12-11)
- [RCE in React Server Components · GitHub Advisory](https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp)
- [Exploitation of Critical Vulnerability - Palo Alto](https://unit42.paloaltonetworks.com/cve-2025-55182-react-and-cve-2025-66478-next/)

---

### ✅ GOOD: React 19.2.3 - Patched and Secure

**Current Version:** `19.2.3`
**Status:** ✅ **SECURE** (Patched release from Dec 2025)

#### What Was Fixed:
- **CVE-2025-55182** (React2Shell) - Critical RCE vulnerability
- **CVE-2025-55184** - High severity DoS
- **CVE-2025-55183** - Medium severity source code exposure

#### Details:
React 19.2.3 is a security patch release that fixes critical vulnerabilities affecting versions 19.0.0 through 19.2.2. These vulnerabilities allowed:
- Unauthenticated remote code execution (RCE)
- Denial of Service attacks
- Backend source code exposure (potentially leaking API keys)

#### Action:
✅ **No action needed** - Already on patched version

#### References:
- [Critical Security Vulnerability in React Server Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [Denial of Service and Source Code Exposure](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components)
- [Security Advisory: Critical RCE Vulnerabilities - Snyk](https://snyk.io/blog/security-advisory-critical-rce-vulnerabilities-react-server-components/)

---

### ⚠️ WARNING: @supabase/supabase-js 2.50.1 - Outdated

**Current Version:** `2.50.1`
**Latest Secure Version:** `2.70.0+`
**Status:** ⚠️ **OUTDATED** - Contains dependencies with known vulnerabilities

#### Known Vulnerability:
- **CVE-2025-48370** - Directory traversal in @supabase/auth-js
- **Affected:** Versions prior to 2.69.1
- **Impact:** URL path traversal due to missing UUID validation in getUserById, deleteUser, updateUserById, listFactors, deleteFactor

#### Recommended Action:
```bash
# Upgrade to latest secure version
pnpm update @supabase/supabase-js@latest
pnpm update @supabase/ssr@latest
```

#### References:
- [CVE-2025-48370 Details](https://www.cvedetails.com/cve/CVE-2025-48370/)
- [Directory Traversal in @supabase/auth-js - Snyk](https://security.snyk.io/vuln/SNYK-JS-SUPABASEAUTHJS-10255365)
- [Supabase Security Overview](https://github.com/supabase/supabase/security)

---

### ✅ Stripe 20.1.0 - No Known Vulnerabilities

**Current Version:** `20.1.0`
**Status:** ✅ **SECURE** (No reported vulnerabilities in package)

#### Note:
- Stripe SDK itself has no known vulnerabilities
- Keep Node.js runtime updated (separate from Stripe package)
- Node.js 20.x runtime has pending security releases scheduled for Jan 7, 2026

#### Action:
✅ **No immediate action** - Monitor for updates

#### References:
- [Stripe Node.js SDK Documentation](https://docs.stripe.com/sdks)
- [Stripe Node Releases](https://github.com/stripe/stripe-node/releases)

---

## 📦 Dependency Version Analysis

### Framework & Runtime

| Package | Current | Latest Stable | Status | Action |
|---------|---------|---------------|--------|--------|
| **next** | 16.1.1 | 16.0.10 | 🔴 Vulnerable | DOWNGRADE ASAP |
| **react** | 19.2.3 | 19.2.3 | ✅ Secure | None |
| **react-dom** | 19.2.3 | 19.2.3 | ✅ Secure | None |
| **typescript** | ^5 | 5.7.3 | ⚠️ Pin version | Update |

### Authentication & Database

| Package | Current | Latest | Status | Action |
|---------|---------|--------|--------|--------|
| **@supabase/supabase-js** | 2.50.1 | 2.70.0+ | ⚠️ Outdated | Upgrade |
| **@supabase/ssr** | 0.6.1 | Latest | ⚠️ Check | Upgrade |

### Payments

| Package | Current | Latest | Status | Action |
|---------|---------|--------|--------|--------|
| **stripe** | 20.1.0 | Latest | ✅ Good | Monitor |

### UI & Styling

| Package | Current | Latest | Status | Action |
|---------|---------|--------|--------|--------|
| **tailwindcss** | ^4 | 4.1.0 | ⚠️ Pin version | Update to 4.1.0 |
| **@tailwindcss/postcss** | ^4 | 4.1.0 | ⚠️ Pin version | Update |
| **framer-motion** | 11.3.24 | Latest | ⚠️ Check | Update |
| **next-themes** | 0.4.6 | Latest | ✅ Good | None |
| **lucide-react** | 0.475.0 | Latest | ⚠️ Check | Update |

### Utilities

| Package | Current | Latest | Status | Action |
|---------|---------|--------|--------|--------|
| **zod** | 3.24.1 | 3.24.2+ | ⚠️ Minor update | Update |
| **clsx** | 2.1.1 | Latest | ✅ Good | None |
| **tailwind-merge** | 2.5.4 | Latest | ⚠️ Check | Update |

---

## 🎯 Immediate Action Plan (Priority Order)

### 🔴 P0 - CRITICAL (Do Today)

1. **Fix Next.js RCE Vulnerability**
   ```bash
   # Option 1: Downgrade to stable 16.0.x
   pnpm update next@16.0.10

   # Option 2: Move to stable 15.x
   pnpm update next@15.6.0

   # Test after update
   pnpm build
   pnpm dev
   ```

2. **Test App After Next.js Update**
   - Run verify script: `bash scripts/codex/verify.sh`
   - Test auth flows (login, signup, magic link)
   - Test protected routes
   - Test Stripe integration
   - Test admin routes

### ⚠️ P1 - HIGH (This Week)

3. **Upgrade Supabase Dependencies**
   ```bash
   pnpm update @supabase/supabase-js@latest
   pnpm update @supabase/ssr@latest

   # Check for breaking changes
   # Review migration guide if needed
   ```

4. **Update Tailwind CSS to 4.1.0**
   ```bash
   pnpm update tailwindcss@4.1.0
   pnpm update @tailwindcss/postcss@4.1.0

   # Tailwind v4.1 adds text-shadow, masks, and more
   # Review changelog for new features
   ```

5. **Run Full Dependency Audit**
   ```bash
   pnpm audit
   pnpm outdated

   # Review and update remaining packages
   ```

### 📋 P2 - MEDIUM (This Month)

6. **Update Remaining Dependencies**
   ```bash
   pnpm update framer-motion@latest
   pnpm update lucide-react@latest
   pnpm update zod@latest
   pnpm update tailwind-merge@latest
   ```

7. **Pin Exact Versions**
   - Remove `^` from critical dependencies in package.json
   - Use exact versions for framework packages
   - Keep `^` only for dev dependencies

8. **Set Up Automated Dependency Monitoring**
   - Configure GitHub Dependabot
   - Enable security alerts
   - Schedule monthly dependency reviews

---

## 📊 Code Quality Metrics

### TypeScript Configuration

**Status:** ✅ **EXCELLENT**
**Strict Mode:** ✅ Enabled
**Configuration:**
```json
{
  "strict": true,
  "noEmit": true,
  "skipLibCheck": true
}
```

### Type Safety Analysis

- **Total `any` types found:** 4 occurrences (very good!)
- **Client components:** 6 out of 66 total files (~9% client-side)
- **Server-first ratio:** 91% server components ✅

**Recommendation:** Excellent TypeScript discipline. The low `any` usage indicates strong type safety.

---

## 🏗️ Architecture Health

### Next.js App Router Usage

- ✅ Using App Router (modern)
- ✅ Server Components by default
- ✅ Minimal client components (only where needed)
- ✅ Route groups for organization

### Component Distribution

- **Total app files:** 66
- **Client components:** 6 (9%)
- **Server components:** 60 (91%)

**Analysis:** Excellent server/client boundary discipline. Most components are server-rendered, with client components only for interactivity.

---

## 🔐 Security Best Practices

### Current Strengths

✅ React 19.2.3 (patched for RCE)
✅ TypeScript strict mode enabled
✅ Zod for input validation
✅ Stripe for secure payments
✅ Supabase RLS policies (per docs)
✅ Server Components by default (reduces client bundle)

### Areas for Improvement

⚠️ Next.js version vulnerable to RCE
⚠️ Supabase dependencies need update
⚠️ No automated dependency scanning (add Dependabot)
⚠️ Consider adding Content Security Policy headers
⚠️ Add automated security testing (OWASP ZAP, etc.)

---

## 📝 Compatibility Notes

### Tailwind CSS 4.x Browser Support

**Minimum Versions:**
- Safari 16.4+
- Chrome 111+
- Firefox 128+

**Impact:** Modern browsers only. If you need to support older browsers, consider:
- Adding autoprefixer configuration
- Testing on target browsers
- Providing graceful degradation

### Next.js 16 vs 15

**Consideration:** Next.js 16 is very new (released Dec 2025). Consider:
- **Option A:** Stay on 16.0.10 (latest stable 16.x)
- **Option B:** Downgrade to 15.6.0 (more mature, still supported)

**Recommendation:** If you don't need Next.js 16 features, consider 15.6.0 for stability.

---

## 🎯 Monthly Maintenance Checklist

### Security

- [ ] Run `pnpm audit` for vulnerabilities
- [ ] Check for security advisories (Next.js, React, Supabase)
- [ ] Review GitHub security alerts
- [ ] Update dependencies with patches

### Updates

- [ ] Review `pnpm outdated` output
- [ ] Check for breaking changes in changelogs
- [ ] Test updates in dev environment
- [ ] Update staging, then production

### Monitoring

- [ ] Review Vercel deployment logs
- [ ] Check Sentry for errors (if configured)
- [ ] Monitor Stripe webhook failures
- [ ] Review Supabase logs

---

## 📚 References & Resources

### Security
- [Next.js Security Updates](https://nextjs.org/blog/security-update-2025-12-11)
- [React Security Blog](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [Supabase Security](https://supabase.com/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Best Practices
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4.1 Release](https://tailwindcss.com/blog/tailwindcss-v4-1)
- [Vercel Security Best Practices](https://vercel.com/docs/security)

### Tools
- [Snyk Vulnerability Database](https://security.snyk.io/)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)

---

**Next Review:** 2026-02-03
**Reviewed By:** Claude Code CLI
**Status:** 🔴 **Action Required** - Update Next.js immediately

You are Codex. Follow AGENTS.md and living docs:
- CHANGE_POLICY.md
- QA_UX.md
- SECURITY_QA.md
- ROUTING_BACKLOG.md
- BACKLOG.md
- CURRENT_APP_TREE.md

PR BRANCH: codex/p0-fix-onboarding-redirect-loop

# 1) Scope (Allowed files ONLY)
You may create/modify ONLY:

## Guard + layouts
- src/components/auth/app-guard.tsx (update: remove onboarding redirect logic + header-path inference)
- src/app/(app)/layout.tsx (should remain wrapper of AppGuard; only touch if needed)
- src/app/(app)/(protected)/layout.tsx (NEW: onboarding/address gating)

## Route moves (git mv; update imports only if needed)
- src/app/(app)/account/** -> src/app/(app)/(protected)/account/**
- src/app/(app)/schedule/** -> src/app/(app)/(protected)/schedule/**
- src/app/(app)/track/** -> src/app/(app)/(protected)/track/**
- src/app/(app)/billing/** -> src/app/(app)/(protected)/billing/** (only if billing exists)

## Living docs (must update)
- CHANGE_POLICY.md
- BACKLOG.md
- ROUTING_BACKLOG.md
- QA_UX.md
- QA_UX_REPORT.md
- CURRENT_APP_TREE.md

Do NOT modify auth callback route:
- src/app/(auth)/auth/callback/route.ts MUST NOT be changed (it’s already correct).
No dependencies. No binaries. No secrets.

# 2) Problem
Confirm email / magic link flow results in redirect loop:
- /auth/callback -> /onboarding -> 307 -> /onboarding repeats

Root cause:
- AppGuard performs onboarding/address gating and tries to infer whether current route is onboarding using request headers/referer.
- During callback/redirect chains, inferred path can be wrong; AppGuard redirects to /onboarding even when already on /onboarding.

# 3) Fix strategy (must implement)
- Make AppGuard AUTH-ONLY (and keep optional service-role profile upsert).
- Move onboarding/address gating into a dedicated nested route-group layout:
  src/app/(app)/(protected)/layout.tsx
- Move customer routes /account /schedule /track /billing into (protected) group via git mv.
- Keep onboarding page outside (protected): src/app/(app)/onboarding/page.tsx remains in place.

# 4) Pinned code

## 4A) Update src/components/auth/app-guard.tsx (REPLACE ENTIRE FILE)
```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSafeRedirectPath } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AppGuardProps = {
  children: React.ReactNode;
};

export default async function AppGuard({ children }: AppGuardProps) {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.
        </p>
      </div>
    );
  }

  const requestHeaders = await headers();
  const rawPath =
    requestHeaders.get("x-next-url") ??
    requestHeaders.get("x-original-url") ??
    requestHeaders.get("x-pathname") ??
    null;

  const currentPath = getSafeRedirectPath(rawPath, "/account");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`/login?reason=auth&next=${encodeURIComponent(currentPath)}`);
  }

  // Keep your existing “profile upsert” behavior (service-role only).
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createSupabaseAdminClient();
    await adminClient.from("profiles").upsert({
      id: data.user.id,
      email: data.user.email,
      full_name:
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.name ??
        null,
      phone: data.user.user_metadata?.phone ?? null,
    });
  }

  // NOTE:
  // Onboarding/address gating is enforced in src/app/(app)/(protected)/layout.tsx
  // This prevents redirect loops on /onboarding.
  return children;
}
````

## 4B) Create src/app/(app)/(protected)/layout.tsx (NEW FILE)

```tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?reason=auth&next=${encodeURIComponent("/account")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Admin bypass: operations accounts can proceed without customer onboarding.
  if (profile?.is_admin) {
    return <>{children}</>;
  }

  const { data: primaryAddress } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (!profile?.onboarding_completed || !primaryAddress?.id) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
```

## 4C) Route moves via git mv (URLs remain unchanged)

Move:

* src/app/(app)/account -> src/app/(app)/(protected)/account
* src/app/(app)/schedule -> src/app/(app)/(protected)/schedule
* src/app/(app)/track -> src/app/(app)/(protected)/track
* src/app/(app)/billing -> src/app/(app)/(protected)/billing (only if exists)

Fix any import paths that break due to move. Do NOT change UI besides import fixes.

## 4D) src/app/(app)/layout.tsx

Do not change unless necessary. It should remain:

```tsx
import AppGuard from "@/components/auth/app-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppGuard>{children}</AppGuard>;
}
```

# 5) Docs updates (must)

Update docs to record the new boundaries and the fixed loop:

* CHANGE_POLICY.md:
  Add: “AppGuard is auth-only. Onboarding gating must live in (app)/(protected) layout to prevent loops.”
* BACKLOG.md:
  Mark as done: “Fix onboarding redirect loop after magic link confirm.”
* ROUTING_BACKLOG.md:
  Add: “(app)=auth-only, (app)/(protected)=onboarding + primary address required.”
* QA_UX.md + QA_UX_REPORT.md:
  Add/mark passing:

  1. Signup → confirm link → /auth/callback → /onboarding renders once (no loop)
  2. Visiting /schedule while not onboarded redirects to /onboarding once
  3. After onboarding, /account /schedule /track accessible
* CURRENT_APP_TREE.md:
  Update app tree to show moved routes and new (protected) layout.

# 6) Testing (required)

1. Run: bash scripts/codex/verify.sh
2. Manual:

* Clear cookies
* Signup → confirm link
* Ensure you land on /onboarding once without loops
* Before onboarding: /schedule -> /onboarding once
* Complete onboarding -> /schedule works

# 7) Done criteria

* No /onboarding 307 loop
* AppGuard no longer gates onboarding/address
* Protected layout gates onboarding/address for customer pages
* Docs updated
* verify.sh passes
* Open PR with Summary + How to test + risk/rollback

````

---

# ✅ Codex Cloud task message (copy/paste)

---

## Why we don’t touch your callback route

`src/app/(auth)/auth/callback/route.ts` already:

* exchanges the code
* sets cookies (via allowSetCookies)
* gates admin routes safely
* uses safe redirect paths
  So the loop is **not there** — it’s in the `AppGuard` gating + path inference.

---

For extra safety improvement: remove *all* “header-based currentPath logic” from AppGuard entirely and just use `nextUrl.pathname` in middleware, but the above is enough to stop the loop now with minimal conflicts.

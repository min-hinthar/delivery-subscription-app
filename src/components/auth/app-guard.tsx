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

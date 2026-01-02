import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          scheduling.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const requestHeaders = await headers();
    const rawPath =
      requestHeaders.get("x-next-url") ??
      requestHeaders.get("x-original-url") ??
      requestHeaders.get("x-pathname") ??
      null;
    const currentPath = getSafeRedirectPath(rawPath, "/account");
    redirect(`/login?reason=auth&next=${encodeURIComponent(currentPath)}`);
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

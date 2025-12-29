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
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          authentication.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const requestHeaders = await headers();
    const headerPath =
      requestHeaders.get("x-pathname") ??
      requestHeaders.get("x-next-url") ??
      requestHeaders.get("referer");
    const nextPath = getSafeRedirectPath(headerPath, "/account");
    redirect(`/login?reason=auth&next=${encodeURIComponent(nextPath)}`);
  }

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_completed, is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  const { data: primaryAddress } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (!profile?.is_admin && (!profile?.onboarding_completed || !primaryAddress?.id)) {
    redirect("/onboarding");
  }

  return children;
}

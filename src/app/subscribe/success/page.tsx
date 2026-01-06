import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SubscribeSuccessPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
          complete subscription onboarding.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const { data: primaryAddress } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (!profile?.onboarding_completed || !primaryAddress?.id) {
    redirect("/onboarding");
  }

  redirect("/schedule");
}

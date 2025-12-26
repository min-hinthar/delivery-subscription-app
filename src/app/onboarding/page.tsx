import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
          onboarding.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .maybeSingle();

  const { data: address } = await supabase
    .from("addresses")
    .select(
      "id, line1, line2, city, state, postal_code, country, instructions, is_primary",
    )
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="text-2xl" role="img" aria-label="Sparkling bowl">
            🥣
          </span>
          <span className="text-sm font-medium uppercase tracking-wide">
            Quick setup
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-foreground">Onboarding</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Share your delivery details so we can prep your weekly order.
        </p>
      </div>
      <Card>
        <OnboardingForm userId={user.id} initialProfile={profile} primaryAddress={address} />
      </Card>
    </div>
  );
}

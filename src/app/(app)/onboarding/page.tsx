import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering - this page needs cookies() for Supabase auth
export const dynamic = "force-dynamic";

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
    redirect(`/login?reason=auth&next=${encodeURIComponent("/onboarding")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, email, onboarding_completed, household_size, preferred_delivery_day, preferred_time_window, dietary_restrictions",
    )
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

  if (profile?.onboarding_completed && address?.id) {
    redirect("/account");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Quick setup"
        title="Onboarding"
        description="Share your delivery details so we can prep your weekly order."
      />
      <Card>
        <OnboardingForm initialProfile={profile} primaryAddress={address} />
      </Card>
    </div>
  );
}

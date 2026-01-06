import { redirect } from "next/navigation";

import { DriverOnboardingForm } from "@/components/driver/onboarding-form";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering - this page needs cookies() for Supabase auth
export const dynamic = "force-dynamic";

export default async function DriverOnboardingPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable driver
          onboarding.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/driver/login");
  }

  const { data: profile } = await supabase
    .from("driver_profiles")
    .select(
      "full_name, phone, vehicle_make, vehicle_model, vehicle_color, license_plate",
    )
    .eq("id", data.user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card className="space-y-6 p-6">
        <DriverOnboardingForm
          initialValues={{
            full_name: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            vehicle_make: profile?.vehicle_make ?? "",
            vehicle_model: profile?.vehicle_model ?? "",
            vehicle_color: profile?.vehicle_color ?? "",
            license_plate: profile?.license_plate ?? "",
          }}
        />
      </Card>
    </div>
  );
}

import { redirect } from "next/navigation";

import { AuthAlert } from "@/components/auth/auth-alert";
import { DriverLoginForm } from "@/components/driver/driver-login-form";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DriverLoginPage() {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable driver
          login.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: driverProfile } = await supabase
      .from("driver_profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();

    if (driverProfile?.status === "pending") {
      redirect("/driver/onboarding");
    }

    if (driverProfile?.status === "active") {
      redirect("/driver/dashboard");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="space-y-2 text-center">
        <span className="text-3xl" role="img" aria-label="Delivery truck">
          🚚
        </span>
        <h1 className="text-3xl font-semibold text-foreground">Driver login</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we&apos;ll send a secure magic link.
        </p>
      </div>
      <Card className="space-y-4 p-6">
        <AuthAlert />
        <DriverLoginForm />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Need access? Contact operations to receive a driver invite.
        </p>
      </Card>
    </div>
  );
}

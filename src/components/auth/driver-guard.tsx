import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DriverGuardProps = {
  children: React.ReactNode;
};

export default async function DriverGuard({ children }: DriverGuardProps) {
  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasSupabaseConfig) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable driver
          authentication.
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

  const currentPath = getSafeRedirectPath(rawPath, "/driver/dashboard");
  const isOnboardingRoute = currentPath.startsWith("/driver/onboarding");

  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`/driver/login?reason=auth&next=${encodeURIComponent(currentPath)}`);
  }

  const { data: driverProfile } = await supabase
    .from("driver_profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!driverProfile) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">Driver access required</h1>
        <p className="text-slate-500 dark:text-slate-400">
          This area is reserved for active delivery drivers. Contact operations for access.
        </p>
        <div className="flex justify-center">
          <Link
            href="/"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  if (driverProfile.status === "suspended") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">Driver access suspended</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Your driver account is currently suspended. Please contact operations support.
        </p>
        <div className="flex justify-center">
          <Link
            href="/driver/login"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  if (driverProfile.status === "pending" && !isOnboardingRoute) {
    redirect("/driver/onboarding");
  }

  return children;
}

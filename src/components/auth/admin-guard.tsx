import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminGuardProps = {
  children: React.ReactNode;
};

export default async function AdminGuard({ children }: AdminGuardProps) {
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
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">Admin access required</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Sign in with an admin account to access operations dashboards.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login?next=/admin"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">Insufficient access</h1>
        <p className="text-slate-500 dark:text-slate-400">
          This section is reserved for operations administrators.
        </p>
      </div>
    );
  }

  return children;
}

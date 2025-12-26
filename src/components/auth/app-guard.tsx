import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Please sign in to access your account, schedule deliveries, and track orders.
        </p>
        <div className="flex justify-center">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
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
    });
  }

  return children;
}

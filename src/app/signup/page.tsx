import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SignupPage() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/account");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="text-2xl" role="img" aria-label="Smiling bowl">
            🍜
          </span>
          <span className="text-sm font-medium uppercase tracking-wide">Start your plan</span>
        </div>
        <h1 className="text-3xl font-semibold text-foreground">Create your account</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Share your email and phone to get a signup link and schedule deliveries.
        </p>
      </div>
      <Card className="space-y-4">
        <AuthForm mode="signup" />
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Sign in
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

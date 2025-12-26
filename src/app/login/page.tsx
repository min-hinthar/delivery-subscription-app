import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
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
          <span className="text-2xl" role="img" aria-label="Sparkles">
            ✨
          </span>
          <span className="text-sm font-medium uppercase tracking-wide">Welcome back</span>
        </div>
        <h1 className="text-3xl font-semibold text-foreground">Login</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Enter your email to get a magic link.
        </p>
      </div>
      <Card className="space-y-4">
        <AuthForm mode="login" />
        <div className="text-sm text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
          >
            Create an account
          </Link>
          .
        </div>
      </Card>
    </div>
  );
}

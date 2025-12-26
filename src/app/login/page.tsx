import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Login</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Sign in with your email and password or request a magic link.
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

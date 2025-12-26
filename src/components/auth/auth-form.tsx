"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_ERRORS = {
  missingEmail: "Email is required.",
};

type AuthFormProps = {
  mode: "login" | "signup";
};

const EMAIL_REDIRECTS = {
  login: "/account",
  signup: "/onboarding",
};

const InputIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-200">
    {children}
  </span>
);

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError(DEFAULT_ERRORS.missingEmail);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectPath = EMAIL_REDIRECTS[mode];

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
          shouldCreateUser: mode === "signup",
        },
      });

      if (otpError) {
        throw otpError;
      }

      setMessage(
        mode === "signup"
          ? "Check your email to confirm and finish your account setup."
          : "Check your email for a login link.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Email
        </label>
        <div className="relative">
          <InputIcon>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 6h16v12H4z" />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </InputIcon>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-12 pr-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
        We’ll email you a magic link so you can sign in without a password.
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleEmailAuth} disabled={isLoading}>
          {isLoading
            ? "Sending…"
            : mode === "signup"
              ? "Email me a signup link"
              : "Email me a login link"}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

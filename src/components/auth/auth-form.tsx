"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_ERRORS = {
  missingEmail: "Email is required.",
  missingPassword: "Password is required.",
};

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (intent: "password" | "magic") => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError(DEFAULT_ERRORS.missingEmail);
      return;
    }

    if (intent === "password" && !password) {
      setError(DEFAULT_ERRORS.missingPassword);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (intent === "magic") {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });

        if (otpError) {
          throw otpError;
        }

        setMessage("Check your email for a login link.");
        return;
      }

      if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        });

        if (signupError) {
          throw signupError;
        }

        setMessage("Account created. Check your inbox to confirm your email.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      window.location.assign("/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleAuth("password")} disabled={isLoading}>
          {isLoading
            ? "Working…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>
        <Button
          onClick={() => handleAuth("magic")}
          disabled={isLoading}
          className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
        >
          {isLoading ? "Sending…" : "Email me a login link"}
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

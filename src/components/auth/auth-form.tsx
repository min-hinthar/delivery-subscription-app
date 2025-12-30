"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { friendlyAuthError } from "@/lib/auth/errorMessages";
import { getSafeRedirectPath } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_ERRORS = {
  missingEmail: "Email is required.",
};

type AuthFormProps = {
  mode: "login" | "signup";
  redirectPath?: string;
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

export function AuthForm({ mode, redirectPath }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const handleEmailAuth = async () => {
    if (isLoading) {
      return;
    }

    setError(null);
    setEmailError(null);
    setMessage(null);

    if (!email) {
      setEmailError(DEFAULT_ERRORS.missingEmail);
      emailRef.current?.focus();
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTarget = getSafeRedirectPath(redirectPath, EMAIL_REDIRECTS[mode]);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTarget,
          )}`,
          shouldCreateUser: mode === "signup",
        },
      });

      if (otpError) {
        throw otpError;
      }

      const nextMessage =
        mode === "signup"
          ? "Check your email to confirm and finish your account setup."
          : "Check your email for a login link.";
      setMessage(nextMessage);
      toast({
        title: "Check your email",
        description: nextMessage,
      });
    } catch (caught) {
      const nextError =
        mode === "login"
          ? friendlyAuthError(caught)
          : caught instanceof Error
            ? caught.message
            : "Authentication failed.";
      setError(nextError);
      toast({
        title: "Authentication failed",
        description: nextError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending) {
      return;
    }

    setError(null);
    setEmailError(null);
    setMessage(null);

    if (!email) {
      setEmailError(DEFAULT_ERRORS.missingEmail);
      emailRef.current?.focus();
      return;
    }

    setIsResending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTarget = getSafeRedirectPath(redirectPath, EMAIL_REDIRECTS[mode]);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTarget,
          )}`,
          shouldCreateUser: mode === "signup",
        },
      });

      if (otpError) {
        throw otpError;
      }

      const nextMessage = "Fresh login link sent. Check your email.";
      setMessage(nextMessage);
      toast({
        title: "Login link sent",
        description: nextMessage,
      });
    } catch (caught) {
      const nextError =
        mode === "login"
          ? friendlyAuthError(caught)
          : caught instanceof Error
            ? caught.message
            : "Unable to resend link.";
      setError(nextError);
      toast({
        title: "Unable to resend link",
        description: nextError,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
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
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(null);
            }}
            ref={emailRef}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "auth-email-error" : undefined}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-12 pr-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        {emailError ? (
          <p id="auth-email-error" className="text-xs text-rose-600">
            {emailError}
          </p>
        ) : null}
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
        <Button
          onClick={handleResend}
          disabled={isResending || isLoading}
          className="bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {isResending ? "Resending…" : "Resend link"}
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

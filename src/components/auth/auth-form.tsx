"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DEFAULT_ERRORS = {
  missingEmail: "Email is required.",
  missingPhone: "Phone number is required.",
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
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError(null);
    setMessage(null);
    setPhoneOtpSent(false);
    setOtpCode("");

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
          data: phone
            ? {
                phone,
              }
            : undefined,
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

  const handlePhoneAuth = async () => {
    setError(null);
    setMessage(null);

    if (!phone) {
      setError(DEFAULT_ERRORS.missingPhone);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: mode === "signup",
          data: email
            ? {
                email,
              }
            : undefined,
        },
      });

      if (otpError) {
        throw otpError;
      }

      setPhoneOtpSent(true);
      setMessage("Enter the code we texted to your phone.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setError(null);
    setMessage(null);

    if (!phone) {
      setError(DEFAULT_ERRORS.missingPhone);
      return;
    }

    if (!otpCode) {
      setError("Enter the verification code from your text message.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otpCode,
        type: "sms",
      });

      if (verifyError) {
        throw verifyError;
      }

      window.location.assign(mode === "signup" ? "/onboarding" : "/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed.");
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
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Phone
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
              <path d="M7 4h10v16H7z" />
              <path d="M11 18h2" />
            </svg>
          </InputIcon>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-12 pr-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
        Choose email for a magic link or phone for a one-time code. No passwords needed.
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
          onClick={handlePhoneAuth}
          disabled={isLoading}
          className="bg-slate-200 text-slate-900 hover:shadow-md dark:bg-slate-800 dark:text-slate-100"
        >
          {isLoading
            ? "Sending…"
            : mode === "signup"
              ? "Text me a signup code"
              : "Text me a login code"}
        </Button>
      </div>
      {phoneOtpSent ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="space-y-2">
            <label
              htmlFor="otp"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              SMS code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
              placeholder="123456"
              autoComplete="one-time-code"
            />
          </div>
          <Button onClick={handleVerifyPhoneOtp} disabled={isLoading}>
            {isLoading ? "Verifying…" : "Verify code"}
          </Button>
        </div>
      ) : null}
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

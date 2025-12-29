"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export function AuthAlert() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  const content = useMemo(() => {
    if (!error && !message) {
      return null;
    }

    return {
      title: error === "otp_expired" ? "Login link expired" : "Login issue",
      description: message
        ? decodeURIComponent(message.replace(/\+/g, " "))
        : "Please request a fresh login link.",
    };
  }, [error, message]);

  if (!content) {
    return null;
  }

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
      <p className="font-medium">{content.title}</p>
      <p className="text-xs">{content.description}</p>
    </div>
  );
}

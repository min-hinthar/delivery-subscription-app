"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { toast } from "@/components/ui/use-toast";
import { friendlyAuthError } from "@/lib/auth/errorMessages";

export function DriverLoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!email) {
      setError("Email is required.");
      emailRef.current?.focus();
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/driver/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to send login link.");
      }

      const nextMessage = "Check your inbox for a secure login link.";
      setMessage(nextMessage);
      toast({
        title: "Magic link sent",
        description: nextMessage,
      });
    } catch (caught) {
      const nextError =
        caught instanceof Error ? friendlyAuthError(caught) : "Unable to send login link.";
      setError(nextError);
      toast({
        title: "Unable to send link",
        description: nextError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <InputField
        label="Email address"
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(null);
        }}
        error={error ?? undefined}
        ref={emailRef}
        autoComplete="email"
      />
      {message ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={isLoading}>
        {isLoading ? "Sending link..." : "Send magic link"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type BillingActionButtonProps = {
  endpoint: string;
  label: string;
  loadingLabel?: string;
  className?: string;
};

export function BillingActionButton({
  endpoint,
  label,
  loadingLabel = "Working…",
  className,
}: BillingActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message ?? "Unable to start billing flow.");
      }

      const url = payload.data?.url as string | undefined;

      if (!url) {
        throw new Error("Missing Stripe redirect URL.");
      }

      window.location.assign(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button className={className} onClick={handleClick} disabled={isLoading}>
        {isLoading ? loadingLabel : label}
      </Button>
      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

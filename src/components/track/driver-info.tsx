"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type DriverInfoProps = {
  driverName: string | null;
  className?: string;
};

export function DriverInfo({ driverName, className }: DriverInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Driver info</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Privacy-focused contact details
          </p>
        </div>
        <ChevronDown
          className={cn("h-5 w-5 text-slate-500 transition", isOpen ? "rotate-180" : "")}
        />
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Assigned driver</p>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {driverName ?? "Driver assigned soon"}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For privacy, we don’t share personal phone numbers or photos.
          </p>
          <a
            href="mailto:support@morningstardelivery.com"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Contact support
          </a>
        </div>
      ) : null}
    </div>
  );
}

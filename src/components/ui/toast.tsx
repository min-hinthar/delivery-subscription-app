"use client";

import { cn } from "@/lib/utils";
import type { ToastItem } from "@/components/ui/use-toast";

type ToastProps = ToastItem & {
  onDismiss?: () => void;
};

const variantStyles: Record<NonNullable<ToastItem["variant"]>, string> = {
  default: "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950",
  destructive:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-100",
};

export function Toast({ title, description, variant = "default", onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg",
        variantStyles[variant],
      )}
      role="status"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          {description ? <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-transparent p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Dismiss notification"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

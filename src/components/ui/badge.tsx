import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variant === "default" && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
        variant === "secondary" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        variant === "destructive" && "bg-red-600 text-white",
        variant === "outline" && "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}

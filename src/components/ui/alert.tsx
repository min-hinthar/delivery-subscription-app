import * as React from "react";

import { cn } from "@/lib/utils";

export type AlertProps = React.HTMLAttributes<HTMLDivElement>;

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  ),
);

Alert.displayName = "Alert";

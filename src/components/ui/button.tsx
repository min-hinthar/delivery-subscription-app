import * as React from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "ghost";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-sm dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 dark:text-slate-900",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] dark:focus-visible:ring-slate-100",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };

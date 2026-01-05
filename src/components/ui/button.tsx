import * as React from "react";

import { hapticLight } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "ghost" | "secondary" | "destructive" | "burmese";
export type ButtonSize = "sm" | "default" | "lg" | "icon" | "mobile";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  haptic?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-gradient-to-r from-primary via-primary to-primary/95 text-primary-foreground shadow-sm hover:from-primary hover:via-primary/95 hover:to-primary/90 hover:shadow-lg",
  ghost:
    "bg-transparent text-muted-foreground hover:bg-gradient-to-r hover:from-accent/50 hover:to-accent hover:text-foreground",
  secondary:
    "bg-secondary text-secondary-foreground shadow-sm hover:bg-gradient-to-r hover:from-secondary/90 hover:to-secondary/80",
  destructive:
    "bg-destructive text-destructive-foreground shadow-sm hover:bg-gradient-to-r hover:from-destructive/95 hover:to-destructive/85",
  burmese: "bg-gradient-to-r from-primary via-primary to-primary/95 text-primary-foreground hover:from-primary hover:via-primary/95 hover:to-primary/90 shadow-md",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  default: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11 p-0",
  mobile: "h-12 px-6 text-base md:h-11 md:px-4",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      type = "button",
      variant = "default",
      size = "default",
      loading,
      disabled,
      haptic = true,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none disabled:pointer-events-none disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        onClick={(event) => {
          if (!isDisabled && haptic) {
            hapticLight();
          }
          onClick?.(event);
        }}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wide">Loading</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };

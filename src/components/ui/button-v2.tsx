import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:transform-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#D4A574] via-[#C19663] to-[#8B4513] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-[#D4A574] motion-reduce:hover:transform-none",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-red-500 motion-reduce:hover:transform-none",
        outline:
          "border-2 border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900 focus-visible:ring-gray-400",
        secondary:
          "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus-visible:ring-gray-400",
        ghost:
          "hover:bg-gray-100 dark:hover:bg-gray-900 focus-visible:ring-gray-400",
        link: "text-[#8B4513] underline-offset-4 hover:underline focus-visible:ring-[#8B4513]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const ButtonV2 = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = loading || disabled;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        type={type}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </Comp>
    );
  }
);

ButtonV2.displayName = "ButtonV2";

export { ButtonV2, buttonVariants };

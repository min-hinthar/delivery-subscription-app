import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-900/60",
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = "Card";

export { Card };

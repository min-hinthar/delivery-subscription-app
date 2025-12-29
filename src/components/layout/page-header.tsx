import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  cta?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  cta,
  secondaryAction,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-slate-200/60 pb-6 dark:border-slate-800/60",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {cta || secondaryAction ? (
          <div className="flex flex-wrap gap-3">
            {cta}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}

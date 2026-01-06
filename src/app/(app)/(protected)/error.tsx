"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">We couldn’t load this page</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please try again, or head back to your account dashboard.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/account"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          Back to account
        </Link>
      </div>
    </div>
  );
}

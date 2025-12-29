"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Admin tools failed to load</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please refresh this view or try again in a moment.
        </p>
      </div>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}

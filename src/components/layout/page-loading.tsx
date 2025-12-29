import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading({ title = "Loading" }: { title?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-8 w-2/3 rounded-full" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full" />
      </div>
      <div className="space-y-4 rounded-xl border border-slate-200/60 p-6 dark:border-slate-800/60">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-5/6 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}…</p>
    </div>
  );
}

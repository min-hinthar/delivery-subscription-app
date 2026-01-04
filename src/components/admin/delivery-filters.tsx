"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type DeliveryFiltersProps = {
  weekOptions: string[];
  selectedWeek: string;
  statusFilter?: string;
  searchQuery?: string;
};

export function DeliveryFilters({
  weekOptions,
  selectedWeek,
  statusFilter,
  searchQuery,
}: DeliveryFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateParams(nextWeek: string, nextStatus?: string) {
    const params = new URLSearchParams();
    params.set("week_of", nextWeek);
    if (searchQuery?.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    }
    startTransition(() => {
      router.replace(`/admin/deliveries?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Week of
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
          value={selectedWeek}
          onChange={(event) => updateParams(event.target.value, statusFilter)}
          disabled={isPending}
        >
          {weekOptions.map((week) => (
            <option key={week} value={week}>
              {week}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Status
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
          value={statusFilter ?? "all"}
          onChange={(event) => updateParams(selectedWeek, event.target.value)}
          disabled={isPending}
        >
          <option value="all">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </label>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

type DeliverySearchProps = {
  searchQuery: string;
  selectedWeek: string;
  statusFilter?: string;
};

export function DeliverySearch({
  searchQuery,
  selectedWeek,
  statusFilter,
}: DeliverySearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchQuery);

  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  const paramsBase = useMemo(() => {
    const params = new URLSearchParams();
    params.set("week_of", selectedWeek);
    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    return params;
  }, [selectedWeek, statusFilter]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(paramsBase);
      const trimmed = value.trim();
      if (trimmed) {
        params.set("q", trimmed);
      }
      startTransition(() => {
        router.replace(`/admin/deliveries?${params.toString()}`);
      });
    }, 250);

    return () => clearTimeout(handle);
  }, [paramsBase, router, startTransition, value]);

  return (
    <label className="flex w-full flex-col gap-1 text-sm font-medium md:max-w-sm">
      Search deliveries
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by name, email, or phone"
          className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-500"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isPending}
        />
      </div>
    </label>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { DriverCard, type DriverListItem } from "@/components/admin/driver-card";
import { InviteDriverModal } from "@/components/admin/invite-driver-modal";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Select } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

type DriverListProps = {
  initialDrivers: DriverListItem[];
};

export function DriverList({ initialDrivers }: DriverListProps) {
  const [drivers, setDrivers] = useState<DriverListItem[]>(initialDrivers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
      const matchesTerm =
        !term ||
        driver.email.toLowerCase().includes(term) ||
        (driver.full_name ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [drivers, search, statusFilter]);

  const handleInvite = (driver: {
    id: string;
    email: string;
    status: string;
    invited_at: string | null;
  }) => {
    setDrivers((prev) => [
      {
        id: driver.id,
        email: driver.email,
        full_name: null,
        phone: null,
        vehicle_make: null,
        vehicle_model: null,
        vehicle_color: null,
        license_plate: null,
        status: driver.status,
        invited_at: driver.invited_at,
        confirmed_at: null,
        routeCount: 0,
      },
      ...prev,
    ]);
  };

  const handleDriverUpdate = (updated: DriverListItem) => {
    setDrivers((prev) => prev.map((driver) => (driver.id === updated.id ? updated : driver)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
          <InputField
            label="Search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as string)}
          />
        </div>
        <Button type="button" onClick={() => setInviteOpen(true)}>
          Invite driver
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredDrivers.length ? (
          filteredDrivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} onUpdate={handleDriverUpdate} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No drivers match this filter yet.
          </div>
        )}
      </div>

      <InviteDriverModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInvite}
      />
    </div>
  );
}

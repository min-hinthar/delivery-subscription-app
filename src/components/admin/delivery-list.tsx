"use client";

import { useMemo, useState } from "react";
import { Mail, MapPin, MessageCircle, Route, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";

import { BulkActions } from "@/components/admin/bulk-actions";

export type DeliveryListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  window: string;
  address: string;
  notes: string;
};

type DeliveryListProps = {
  appointments: DeliveryListItem[];
  searchQuery: string;
  selectedWeek: string;
};

const rowActionClasses =
  "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:transform-none";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(value: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return value;
  }

  const escaped = escapeRegExp(trimmed);
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = value.split(regex);
  const lowerQuery = trimmed.toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === lowerQuery ? (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-amber-200/80 px-1 text-amber-950 dark:bg-amber-400/30 dark:text-amber-100"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function toCsvValue(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildCsv(rows: DeliveryListItem[]) {
  const header = [
    "Customer",
    "Email",
    "Phone",
    "Status",
    "Window",
    "Address",
    "Notes",
  ];
  const lines = [header.join(",")];

  rows.forEach((row) => {
    lines.push(
      [
        row.name,
        row.email,
        row.phone,
        row.status,
        row.window,
        row.address,
        row.notes,
      ]
        .map((value) => toCsvValue(value ?? ""))
        .join(","),
    );
  });

  return lines.join("\n");
}

export function DeliveryList({
  appointments,
  searchQuery,
  selectedWeek,
}: DeliveryListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const activeSelectedIds = useMemo(
    () =>
      selectedIds.filter((id) =>
        appointments.some((appointment) => appointment.id === id),
      ),
    [appointments, selectedIds],
  );
  const selectedSet = useMemo(() => new Set(activeSelectedIds), [activeSelectedIds]);
  const allSelected =
    appointments.length > 0 && activeSelectedIds.length === appointments.length;
  const selectedAppointments = useMemo(
    () => appointments.filter((appointment) => selectedSet.has(appointment.id)),
    [appointments, selectedSet],
  );

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      selectedSet.has(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : appointments.map((appointment) => appointment.id));
  }

  function handleExport() {
    if (selectedAppointments.length === 0) {
      return;
    }
    const csv = buildCsv(selectedAppointments);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deliveries-${selectedWeek}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleAssignRoute(ids: string[]) {
    if (ids.length === 0) {
      return;
    }
    const params = new URLSearchParams();
    params.set("week_of", selectedWeek);
    params.set("selected", ids.join(","));
    router.push(`/admin/routes?${params.toString()}`);
  }

  function handleSendMessage(emails: string[]) {
    if (emails.length === 0) {
      return;
    }
    const unique = Array.from(new Set(emails)).join(",");
    window.location.href = `mailto:?bcc=${encodeURIComponent(unique)}`;
  }

  return (
    <div className="space-y-4">
      <BulkActions
        selectedCount={activeSelectedIds.length}
        totalCount={appointments.length}
        allSelected={allSelected}
        onToggleAll={toggleAll}
        onExport={handleExport}
        onAssignRoute={() => handleAssignRoute(selectedIds)}
        onSendMessage={() =>
          handleSendMessage(
            selectedAppointments
              .map((appointment) => appointment.email)
              .filter(Boolean),
          )
        }
      />

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white text-sm dark:border-slate-800 dark:bg-slate-950 md:block">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Window</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
              <th className="px-4 py-3 text-left font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700"
                    checked={selectedSet.has(appointment.id)}
                    onChange={() => toggleSelection(appointment.id)}
                    aria-label={`Select ${appointment.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {highlightMatch(appointment.name, searchQuery)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {highlightMatch(appointment.phone, searchQuery)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {highlightMatch(appointment.email, searchQuery)}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {appointment.window || "Unscheduled"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {appointment.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={rowActionClasses}
                      onClick={() => handleAssignRoute([appointment.id])}
                    >
                      <Route className="h-3 w-3" aria-hidden="true" />
                      Assign
                    </button>
                    <button
                      type="button"
                      className={rowActionClasses}
                      onClick={() => handleSendMessage([appointment.email])}
                      disabled={!appointment.email}
                    >
                      <MessageCircle className="h-3 w-3" aria-hidden="true" />
                      Message
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  <details className="group">
                    <summary className="cursor-pointer font-semibold text-slate-600 transition group-open:text-slate-900 dark:text-slate-300 dark:group-open:text-slate-50">
                      View
                    </summary>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3 w-3" aria-hidden="true" />
                        <span>{appointment.address || "No address"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <StickyNote className="mt-0.5 h-3 w-3" aria-hidden="true" />
                        <span>{appointment.notes || "No delivery notes"}</span>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-2">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700"
                  checked={selectedSet.has(appointment.id)}
                  onChange={() => toggleSelection(appointment.id)}
                  aria-label={`Select ${appointment.name}`}
                />
                <div>
                  <p className="font-semibold">
                    {highlightMatch(appointment.name, searchQuery)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {highlightMatch(appointment.phone, searchQuery)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {highlightMatch(appointment.email, searchQuery)}
                  </p>
                </div>
              </label>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {appointment.status}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {appointment.window || "Unscheduled"}
            </div>
            <details className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              <summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-200">
                Details
              </summary>
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3 w-3" aria-hidden="true" />
                  <span>{appointment.address || "No address"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <StickyNote className="mt-0.5 h-3 w-3" aria-hidden="true" />
                  <span>{appointment.notes || "No delivery notes"}</span>
                </div>
              </div>
            </details>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={rowActionClasses}
                onClick={() => handleAssignRoute([appointment.id])}
              >
                <Route className="h-3 w-3" aria-hidden="true" />
                Assign
              </button>
              <button
                type="button"
                className={rowActionClasses}
                onClick={() => handleSendMessage([appointment.email])}
                disabled={!appointment.email}
              >
                <Mail className="h-3 w-3" aria-hidden="true" />
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

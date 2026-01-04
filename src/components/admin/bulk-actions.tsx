"use client";

import { CheckSquare, Download, Mail, Route } from "lucide-react";

type BulkActionsProps = {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onExport: () => void;
  onAssignRoute: () => void;
  onSendMessage: () => void;
};

const actionClasses =
  "inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:transform-none";

export function BulkActions({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onExport,
  onAssignRoute,
  onSendMessage,
}: BulkActionsProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 bg-white/70 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/60">
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-200">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:border-slate-700"
          checked={allSelected}
          onChange={onToggleAll}
          aria-label={allSelected ? "Deselect all deliveries" : "Select all deliveries"}
        />
        <span className="flex items-center gap-1">
          <CheckSquare className="h-4 w-4" aria-hidden="true" />
          Select all ({totalCount})
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {selectedCount} selected
        </span>
        <button
          type="button"
          className={actionClasses}
          onClick={onAssignRoute}
          disabled={!hasSelection}
        >
          <Route className="h-4 w-4" aria-hidden="true" />
          Assign route
        </button>
        <button
          type="button"
          className={actionClasses}
          onClick={onSendMessage}
          disabled={!hasSelection}
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Message
        </button>
        <button
          type="button"
          className={actionClasses}
          onClick={onExport}
          disabled={!hasSelection}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>
    </div>
  );
}

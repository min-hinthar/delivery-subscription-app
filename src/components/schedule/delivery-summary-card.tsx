"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type DeliverySummaryCardProps = {
  selectedWeekLabel: string;
  selectedWindowLabel?: string | null;
  cutoffAt: string;
  status?: string | null;
  error?: string | null;
  hasAppointment: boolean;
  isCutoffPassed: boolean;
  isSchedulingDisabled: boolean;
  isSaving: boolean;
  confirmDisabled: boolean;
  onConfirm: () => void;
};

export function DeliverySummaryCard({
  selectedWeekLabel,
  selectedWindowLabel,
  cutoffAt,
  status,
  error,
  hasAppointment,
  isCutoffPassed,
  isSchedulingDisabled,
  isSaving,
  confirmDisabled,
  onConfirm,
}: DeliverySummaryCardProps) {
  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Delivery summary</h2>
        <p className="text-sm text-muted-foreground">
          Review your delivery details before confirming the appointment.
        </p>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Week
          </p>
          <p className="text-sm font-medium text-foreground">{selectedWeekLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Time window
          </p>
          <p className="text-sm font-medium text-foreground">
            {selectedWindowLabel ?? "Select a delivery window"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Delivery address
          </p>
          <p className="text-sm text-foreground">Saved in your account profile.</p>
          <Link
            href="/account/profile"
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Change address
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Cutoff: {cutoffAt}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={onConfirm} disabled={confirmDisabled} className="sm:flex-1">
            {isSaving
              ? "Saving…"
              : hasAppointment
                ? "Update appointment"
                : "Confirm appointment"}
          </Button>
          <Link
            href="/account"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            View account
          </Link>
        </div>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        {error ? (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
        {isCutoffPassed ? (
          <p className="text-xs text-rose-600">
            This week is locked after the Friday cutoff. Pick a future weekend or contact
            support.
          </p>
        ) : null}
        {isSchedulingDisabled ? (
          <p className="text-xs text-rose-600">
            Subscription required — activate a plan to schedule deliveries.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

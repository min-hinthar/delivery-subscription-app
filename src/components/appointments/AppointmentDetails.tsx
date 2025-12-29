"use client";

import * as React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { parseApiResponse } from "@/lib/api/client";

import type { AddressOption, DeliveryAppointmentDTO, DeliveryWindowOption } from "./types";

const UpdateSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  delivery_window_id: z.string().uuid(),
  address_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type AppointmentDetailsProps = {
  mode: "page" | "modal";
  appointment: DeliveryAppointmentDTO;
  windows: DeliveryWindowOption[];
  addresses: AddressOption[];
  canEdit: boolean;
  lockReason?: string | null;
  cutoffLabel?: string | null;
  onClose?: () => void; // for modal
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
};

export function AppointmentDetails(props: AppointmentDetailsProps) {
  const {
    mode,
    appointment,
    windows,
    addresses,
    canEdit,
    lockReason,
    cutoffLabel,
    onClose,
    closeButtonRef,
  } = props;

  const [deliveryWindowId, setDeliveryWindowId] = React.useState(appointment.deliveryWindowId);
  const [addressId, setAddressId] = React.useState<string | null>(appointment.addressId);
  const [notes, setNotes] = React.useState<string>(appointment.notes ?? "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSave() {
    setError(null);
    setSuccess(null);

    const payload = UpdateSchema.safeParse({
      week_of: appointment.weekOf,
      delivery_window_id: deliveryWindowId,
      address_id: addressId,
      notes: notes.trim() ? notes.trim() : null,
    });

    if (!payload.success) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/delivery/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });

      const result = await parseApiResponse<{ appointment: unknown }>(res);

      if (!result.ok) {
        setError(result.message);
        toast({
          title: "Unable to save appointment",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      setSuccess("Appointment updated.");
      toast({
        title: "Appointment updated",
        description: "Your changes are saved for this week.",
      });
    } catch {
      setError("Network error. Please check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Delivery for week of {appointment.weekOf}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Status: <span className="font-medium">{appointment.status}</span>
          </p>
          {cutoffLabel ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cutoff: {cutoffLabel} PT
            </p>
          ) : null}
        </div>

        {mode === "modal" && onClose ? (
          <Button
            ref={closeButtonRef}
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </Button>
        ) : null}
      </div>

      {!canEdit && (
        <Alert>
          {lockReason ??
            "This appointment is locked for this weekend. Contact support if you need help."}
        </Alert>
      )}

      {error && <Alert className="border-destructive text-destructive">{error}</Alert>}
      {success && <Alert className="border-green-600 text-green-700">{success}</Alert>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery window</label>
        <select
          value={deliveryWindowId}
          onChange={(event) => {
            setDeliveryWindowId(event.target.value);
            setError(null);
            setSuccess(null);
          }}
          disabled={!canEdit || pending}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
        >
          <option value="">Select a delivery window</option>
          {windows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery address</label>
        <select
          value={addressId ?? "__none__"}
          onChange={(event) => {
            setAddressId(event.target.value === "__none__" ? null : event.target.value);
            setError(null);
            setSuccess(null);
          }}
          disabled={!canEdit || pending}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus-visible:ring-slate-100"
        >
          <option value="__none__">No address selected</option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Tip: keep your primary address updated in Account.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          placeholder="Gate code, delivery instructions, etc."
          disabled={!canEdit || pending}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button onClick={onSave} disabled={!canEdit || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}

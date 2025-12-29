"use client";

import * as React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import type { AddressOption, DeliveryAppointmentDTO, DeliveryWindowOption } from "./types";

const UpdateSchema = z.object({
  id: z.string().uuid(),
  delivery_window_id: z.string().uuid(),
  address_id: z.string().uuid().nullable(),
  notes: z.string().max(2000).nullable(),
});

export type AppointmentDetailsProps = {
  mode: "page" | "modal";
  appointment: DeliveryAppointmentDTO;
  windows: DeliveryWindowOption[];
  addresses: AddressOption[];
  canEdit: boolean;
  onClose?: () => void; // for modal
};

export function AppointmentDetails(props: AppointmentDetailsProps) {
  const { mode, appointment, windows, addresses, canEdit, onClose } = props;

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
      id: appointment.id,
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          json?.error?.message ??
          json?.message ??
          "Could not save changes. Please try again.";
        setError(msg);
        return;
      }

      setSuccess("Saved.");
    } catch {
      setError("Network error. Please check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            Delivery for week of {appointment.weekOf}
          </h1>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{appointment.status}</span>
          </p>
        </div>

        {mode === "modal" && (
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Button>
        )}
      </div>

      {!canEdit && (
        <Alert>
          This appointment is currently locked. If you need help, contact support.
        </Alert>
      )}

      {error && <Alert className="border-destructive text-destructive">{error}</Alert>}
      {success && <Alert className="border-green-600 text-green-700">{success}</Alert>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery window</label>
        <Select value={deliveryWindowId} onValueChange={setDeliveryWindowId} disabled={!canEdit || pending}>
          <SelectTrigger>
            <SelectValue placeholder="Select a delivery window" />
          </SelectTrigger>
          <SelectContent>
            {windows.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Delivery address</label>
        <Select value={addressId ?? "__none__"} onValueChange={(v) => setAddressId(v === "__none__" ? null : v)} disabled={!canEdit || pending}>
          <SelectTrigger>
            <SelectValue placeholder="Select an address" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No address selected</SelectItem>
            {addresses.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Tip: keep your primary address updated in Account.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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

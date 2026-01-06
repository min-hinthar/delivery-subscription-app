"use client";

import { memo, useState, useCallback } from "react";
import { Mail, Phone, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export type DriverListItem = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  status: string;
  invited_at: string | null;
  confirmed_at: string | null;
  routeCount: number;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  suspended: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
};

type DriverCardProps = {
  driver: DriverListItem;
  onUpdate: (driver: DriverListItem) => void;
};

function DriverCardComponent({ driver, onUpdate }: DriverCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const statusLabel = driver.status.charAt(0).toUpperCase() + driver.status.slice(1);
  const statusStyle = STATUS_STYLES[driver.status] ?? STATUS_STYLES.pending;

  const vehicleLabel = [driver.vehicle_color, driver.vehicle_make, driver.vehicle_model]
    .filter(Boolean)
    .join(" ");
  const invitedLabel = driver.invited_at
    ? `Invited ${new Date(driver.invited_at).toLocaleDateString()}`
    : null;

  const handleStatusChange = useCallback(async (status: "active" | "suspended") => {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to update driver.");
      }

      onUpdate({ ...driver, status: payload.data.driver.status });
      toast({
        title: "Driver status updated successfully",
        description: `Driver status has been changed to ${status}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update driver.";
      toast({
        title: "Failed to update driver status",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [driver, isUpdating, onUpdate]);

  const handleResendInvite = useCallback(async () => {
    if (isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/drivers/${driver.id}/resend-invite`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to resend invite.");
      }

      onUpdate({ ...driver, invited_at: payload.data.sent_at ?? driver.invited_at });
      toast({
        title: "Driver invite resent successfully",
        description: "The driver invitation email has been sent again.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resend invite.";
      toast({
        title: "Failed to resend invite",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [driver, isUpdating, onUpdate]);

  return (
    <Card className="flex flex-col gap-4 border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">
            {driver.full_name ?? "Pending driver"}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {driver.email}
            </span>
            {driver.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {driver.phone}
              </span>
            ) : null}
          </div>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyle)}>
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1">
          <Truck className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {vehicleLabel || "Vehicle details pending"}
          {driver.license_plate ? ` • ${driver.license_plate}` : ""}
        </span>
        <span>Assigned routes: {driver.routeCount}</span>
        {invitedLabel ? <span>{invitedLabel}</span> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {driver.status === "pending" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleResendInvite}
            disabled={isUpdating}
          >
            Resend invite
          </Button>
        ) : null}

        {driver.status === "active" ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleStatusChange("suspended")}
            disabled={isUpdating}
          >
            Suspend driver
          </Button>
        ) : null}

        {driver.status === "suspended" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleStatusChange("active")}
            disabled={isUpdating}
          >
            Reactivate
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const DriverCard = memo(DriverCardComponent);

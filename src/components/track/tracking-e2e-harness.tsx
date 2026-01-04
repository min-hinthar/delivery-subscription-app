"use client";

import { useMemo, useState } from "react";

import { EtaDisplay } from "@/components/track/eta-display";
import {
  DeliveryNotificationContainer,
  type DeliveryNotification,
} from "@/components/track/delivery-notification";
import { DeliveryTimeline } from "@/components/track/delivery-timeline";
import type { TrackingStop } from "@/components/track/tracking-dashboard";
import { cn } from "@/lib/utils";

const COMPLETED_STATUSES = new Set(["completed", "delivered"]);

const BASE_TIME = new Date("2026-01-04T18:00:00.000Z");

const toIsoMinutes = (base: Date, minutes: number) =>
  new Date(base.getTime() + minutes * 60_000).toISOString();

const initialStops: TrackingStop[] = [
  {
    id: "stop-1",
    appointmentId: "appointment-1",
    stopOrder: 1,
    status: "completed",
    estimatedArrival: toIsoMinutes(BASE_TIME, -10),
    completedAt: toIsoMinutes(BASE_TIME, -8),
    lat: 34.0522,
    lng: -118.2437,
    isCustomerStop: false,
  },
  {
    id: "stop-2",
    appointmentId: "appointment-1",
    stopOrder: 2,
    status: "in_progress",
    estimatedArrival: toIsoMinutes(BASE_TIME, 20),
    completedAt: null,
    lat: 34.0601,
    lng: -118.238,
    isCustomerStop: true,
  },
  {
    id: "stop-3",
    appointmentId: "appointment-1",
    stopOrder: 3,
    status: "pending",
    estimatedArrival: toIsoMinutes(BASE_TIME, 35),
    completedAt: null,
    lat: 34.0701,
    lng: -118.233,
    isCustomerStop: false,
  },
];

export function TrackingE2EHarness() {
  const [stops, setStops] = useState<TrackingStop[]>(initialStops);
  const [lastUpdated, setLastUpdated] = useState<Date>(BASE_TIME);
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);

  const customerStop = useMemo(
    () => stops.find((stop) => stop.isCustomerStop) ?? null,
    [stops],
  );

  const completedStops = useMemo(
    () =>
      stops.filter(
        (stop) => Boolean(stop.completedAt) || COMPLETED_STATUSES.has(stop.status),
      ).length,
    [stops],
  );

  const currentStopIndex = useMemo(() => {
    const index = stops.findIndex(
      (stop) => !Boolean(stop.completedAt) && !COMPLETED_STATUSES.has(stop.status),
    );
    return index === -1 ? Math.max(0, stops.length - 1) : index;
  }, [stops]);

  const pushNotification = (notification: Omit<DeliveryNotification, "id" | "timestamp">) => {
    setNotifications((prev) => [
      ...prev,
      {
        id: `${notification.type}-${Date.now()}`,
        timestamp: new Date(),
        ...notification,
      },
    ]);
  };

  const updateCustomerStop = (updates: Partial<TrackingStop>) => {
    setStops((prev) =>
      prev.map((stop) =>
        stop.isCustomerStop
          ? {
              ...stop,
              ...updates,
            }
          : stop,
      ),
    );
  };

  const handleEtaUpdate = () => {
    const nextUpdated = new Date(BASE_TIME.getTime() + 10 * 60_000);
    setLastUpdated(nextUpdated);
    updateCustomerStop({
      estimatedArrival: toIsoMinutes(nextUpdated, 8),
    });
    pushNotification({
      type: "eta-update",
      title: "ETA updated",
      message: "Your driver is running a little ahead of schedule.",
    });
  };

  const handleDriverNearby = () => {
    updateCustomerStop({ status: "in_progress" });
    pushNotification({
      type: "driver-nearby",
      title: "Driver is approaching",
      message: "Your delivery is next on the route!",
    });
  };

  const handleDelivered = () => {
    const completedAt = toIsoMinutes(lastUpdated, 0);
    updateCustomerStop({ status: "delivered", completedAt });
    pushNotification({
      type: "delivered",
      title: "Delivery Completed! 🎉",
      message: "Your meal subscription has been delivered.",
    });
  };

  const handleAdvanceStop = () => {
    setStops((prev) => {
      const index = prev.findIndex(
        (stop) => !Boolean(stop.completedAt) && !COMPLETED_STATUSES.has(stop.status),
      );
      if (index === -1) {
        return prev;
      }

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status: "completed",
        completedAt: toIsoMinutes(lastUpdated, 0),
      };

      return updated;
    });
    setLastUpdated(new Date(lastUpdated.getTime() + 5 * 60_000));
    pushNotification({
      type: "status-change",
      title: "Stop completed",
      message: "The driver finished a stop and is moving to the next one.",
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <section className="space-y-6" data-testid="tracking-e2e">
      <DeliveryNotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div data-testid="tracking-eta">
          <EtaDisplay
            estimatedArrival={customerStop?.estimatedArrival ?? null}
            totalStops={stops.length}
            completedStops={completedStops}
            currentStopIndex={currentStopIndex}
            lastUpdated={lastUpdated}
            isReconnecting={false}
          />
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Map rendering is mocked for E2E tracking QA.
        </div>
      </div>

      <div data-testid="tracking-timeline">
        <DeliveryTimeline stops={stops} currentStopIndex={currentStopIndex} />
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
          "dark:border-slate-800 dark:bg-slate-950/60",
        )}
      >
        <button
          type="button"
          data-testid="tracking-update-eta"
          onClick={handleEtaUpdate}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Update ETA
        </button>
        <button
          type="button"
          data-testid="tracking-driver-nearby"
          onClick={handleDriverNearby}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
        >
          Driver nearby
        </button>
        <button
          type="button"
          data-testid="tracking-delivered"
          onClick={handleDelivered}
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 shadow-sm transition hover:bg-green-100 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200 dark:hover:bg-green-900/60"
        >
          Mark delivered
        </button>
        <button
          type="button"
          data-testid="tracking-advance-stop"
          onClick={handleAdvanceStop}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Complete next stop
        </button>
      </div>
    </section>
  );
}

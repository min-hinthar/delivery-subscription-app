"use client";

import { useEffect, useMemo, useState } from "react";

import { TrackingMap } from "@/components/track/tracking-map";
import { EtaDisplay } from "@/components/track/eta-display";
import { DeliveryTimeline } from "@/components/track/delivery-timeline";
import { DriverInfo } from "@/components/track/driver-info";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type TrackingStop = {
  id: string;
  appointmentId: string;
  stopOrder: number;
  status: string;
  estimatedArrival: string | null;
  completedAt: string | null;
  lat: number | null;
  lng: number | null;
  isCustomerStop: boolean;
};

export type TrackingRoute = {
  id: string;
  status: string | null;
  polyline: string | null;
};

export type TrackingDriver = {
  name: string | null;
};

export type TrackingLocation = {
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: string | null;
};

type TrackingDashboardProps = {
  appointmentId: string;
  route: TrackingRoute | null;
  initialStops: TrackingStop[];
  initialUpdatedAt?: string | null;
  customerLocation: { lat: number; lng: number } | null;
  driver: TrackingDriver | null;
  initialDriverLocation: TrackingLocation | null;
  isInTransit: boolean;
};

const COMPLETED_STATUSES = new Set(["completed", "delivered"]);

export function TrackingDashboard({
  appointmentId,
  route,
  initialStops,
  initialUpdatedAt = null,
  customerLocation,
  driver,
  initialDriverLocation,
  isInTransit,
}: TrackingDashboardProps) {
  const [stops, setStops] = useState<TrackingStop[]>(initialStops);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() =>
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "error"
  >(route?.id ? "connecting" : "idle");

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.stopOrder - b.stopOrder),
    [stops],
  );

  const stopProgress = useMemo(() => {
    const completedStops = sortedStops.filter(
      (stop) => Boolean(stop.completedAt) || COMPLETED_STATUSES.has(stop.status),
    ).length;
    const currentStopIndex = sortedStops.findIndex(
      (stop) => !Boolean(stop.completedAt) && !COMPLETED_STATUSES.has(stop.status),
    );

    return {
      total: sortedStops.length,
      completed: completedStops,
      currentIndex: currentStopIndex,
    };
  }, [sortedStops]);

  const customerStop = useMemo(
    () => sortedStops.find((stop) => stop.isCustomerStop) ?? null,
    [sortedStops],
  );

  useEffect(() => {
    if (!route?.id) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("delivery-stops")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_stops",
          filter: `route_id=eq.${route.id}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            appointment_id: string;
            stop_order: number;
            status: string;
            estimated_arrival: string | null;
            completed_at: string | null;
            geocoded_lat: number | null;
            geocoded_lng: number | null;
          };

          setStops((prev) => {
            const existing = prev.find((stop) => stop.id === updated.id);

            if (!existing) {
              return [
                ...prev,
                {
                  id: updated.id,
                  appointmentId: updated.appointment_id,
                  stopOrder: updated.stop_order,
                  status: updated.status,
                  estimatedArrival: updated.estimated_arrival,
                  completedAt: updated.completed_at,
                  lat: updated.geocoded_lat,
                  lng: updated.geocoded_lng,
                  isCustomerStop: updated.appointment_id === appointmentId,
                },
              ];
            }

            return prev.map((stop) =>
              stop.id === updated.id
                ? {
                    ...stop,
                    stopOrder: updated.stop_order,
                    status: updated.status,
                    estimatedArrival: updated.estimated_arrival,
                    completedAt: updated.completed_at,
                    lat: updated.geocoded_lat ?? stop.lat,
                    lng: updated.geocoded_lng ?? stop.lng,
                  }
                : stop,
            );
          });
          setLastUpdated(new Date());
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (channelStatus === "TIMED_OUT") {
          setConnectionStatus("reconnecting");
        } else if (channelStatus === "CHANNEL_ERROR") {
          setConnectionStatus("error");
        } else if (channelStatus === "CLOSED") {
          setConnectionStatus("reconnecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, route?.id]);

  return (
    <div className="space-y-6">
      <EtaDisplay
        estimatedArrival={customerStop?.estimatedArrival ?? null}
        totalStops={stopProgress.total}
        completedStops={stopProgress.completed}
        currentStopIndex={stopProgress.currentIndex}
        lastUpdated={lastUpdated}
        isReconnecting={connectionStatus === "reconnecting"}
      />

      {connectionStatus === "error" ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          Live updates are temporarily unavailable. You can refresh this page to try again.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <TrackingMap
          routeId={route?.id ?? null}
          polyline={route?.polyline ?? null}
          customerLocation={customerLocation}
          stops={sortedStops}
          initialDriverLocation={initialDriverLocation}
          showDriver={isInTransit}
        />
        <DeliveryTimeline
          stops={sortedStops}
          currentStopIndex={stopProgress.currentIndex}
        />
      </div>

      <DriverInfo driverName={driver?.name ?? null} />
    </div>
  );
}

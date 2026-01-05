"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { TrackingMap } from "@/components/track/tracking-map";
import { EtaDisplay } from "@/components/track/eta-display";
import { DeliveryTimeline } from "@/components/track/delivery-timeline";
import { DriverInfo } from "@/components/track/driver-info";
import {
  DeliveryNotificationContainer,
  type DeliveryNotification,
} from "@/components/track/delivery-notification";
import {
  canSendBrowserNotification,
  getNotificationSettings,
  isBrowserNotificationSupported,
  requestNotificationPermission,
  saveNotificationSettings,
  sendBrowserNotification,
  type NotificationSettings,
} from "@/lib/notifications/browser-notifications";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cacheTrackingData, getCachedTrackingData } from "@/lib/tracking/offline-cache";
import type { CachedDeliveryStop } from "@/lib/tracking/offline-cache";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export type TrackingStop = {
  id: string;
  appointmentId: string;
  stopOrder: number;
  status: string;
  estimatedArrival: string | null;
  completedAt: string | null;
  photoUrl?: string | null;
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
  const router = useRouter();
  const [stops, setStops] = useState<TrackingStop[]>(() => {
    if (!route?.id || typeof window === "undefined") {
      return initialStops;
    }

    const cachedData = getCachedTrackingData(route.id);
    if (!cachedData || cachedData.stops.length === 0) {
      return initialStops;
    }

    const cachedStops = cachedData.stops.map((cached) => {
      const existing = initialStops.find((s) => s.id === cached.id);
      return (
        existing || {
          id: cached.id,
          appointmentId: appointmentId,
          stopOrder: cached.stopOrder,
          status: cached.status,
          estimatedArrival: cached.estimatedArrival,
          completedAt: cached.completedAt,
          lat: null,
          lng: null,
          isCustomerStop: false,
        }
      );
    });

    return cachedStops.length > initialStops.length ? cachedStops : initialStops;
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() =>
    initialUpdatedAt ? new Date(initialUpdatedAt) : null,
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "error"
  >(route?.id ? "connecting" : "idle");
  const [isOffline, setIsOffline] = useState(
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings(),
  );
  const notificationsSupported = isBrowserNotificationSupported();
  const lastEtaMinutesRef = useRef<number | null>(null);
  const driverNearbyNotifiedRef = useRef(false);
  const deliveredNotifiedRef = useRef(false);

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
    saveNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
            photo_url: string | null;
            geocoded_lat: number | null;
            geocoded_lng: number | null;
          };

          setStops((prev) => {
            const existing = prev.find((stop) => stop.id === updated.id);

            // Check for status changes to trigger notifications
            const isCustomerStop = updated.appointment_id === appointmentId;
            const statusChanged = existing && existing.status !== updated.status;

            if (statusChanged && isCustomerStop) {
              // Create notification for customer's delivery status change
              const notificationId = `${updated.id}-${Date.now()}`;
              if (updated.status === "completed" || updated.status === "delivered") {
                setNotifications((prevNotifs) => [
                  ...prevNotifs,
                  {
                    id: notificationId,
                    type: "delivered",
                    title: "Delivery Completed! 🎉",
                    message: "Your meal subscription has been delivered.",
                    timestamp: new Date(),
                  },
                ]);
              } else if (updated.status === "in_progress") {
                setNotifications((prevNotifs) => [
                  ...prevNotifs,
                  {
                    id: notificationId,
                    type: "driver-nearby",
                    title: "Driver is approaching",
                    message: "Your delivery is next on the route!",
                    timestamp: new Date(),
                  },
                ]);
              }
            }

            const newStops = existing
              ? prev.map((stop) =>
                  stop.id === updated.id
                    ? {
                        ...stop,
                        stopOrder: updated.stop_order,
                        status: updated.status,
                        estimatedArrival: updated.estimated_arrival,
                        completedAt: updated.completed_at,
                        photoUrl: updated.photo_url ?? stop.photoUrl ?? null,
                        lat: updated.geocoded_lat ?? stop.lat,
                        lng: updated.geocoded_lng ?? stop.lng,
                      }
                    : stop,
                )
              : [
                  ...prev,
                  {
                    id: updated.id,
                    appointmentId: updated.appointment_id,
                    stopOrder: updated.stop_order,
                    status: updated.status,
                    estimatedArrival: updated.estimated_arrival,
                    completedAt: updated.completed_at,
                    photoUrl: updated.photo_url ?? null,
                    lat: updated.geocoded_lat,
                    lng: updated.geocoded_lng,
                    isCustomerStop: updated.appointment_id === appointmentId,
                  },
                ];

            // Cache updated stops
            const cachedStops: CachedDeliveryStop[] = newStops.map((stop) => ({
              id: stop.id,
              stopOrder: stop.stopOrder,
              status: stop.status,
              estimatedArrival: stop.estimatedArrival,
              completedAt: stop.completedAt,
            }));
            cacheTrackingData(route.id, null, cachedStops);

            return newStops;
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

  useEffect(() => {
    lastEtaMinutesRef.current = null;
    driverNearbyNotifiedRef.current = false;
    deliveredNotifiedRef.current = false;
  }, [route?.id, appointmentId]);

  useEffect(() => {
    if (!customerStop || !canSendBrowserNotification(notificationSettings)) {
      return;
    }

    const now = new Date();
    const estimatedArrival = customerStop.estimatedArrival
      ? new Date(customerStop.estimatedArrival)
      : null;

    if (estimatedArrival) {
      const diffMinutes = Math.round((estimatedArrival.getTime() - now.getTime()) / 60000);

      if (
        lastEtaMinutesRef.current !== null &&
        Math.abs(diffMinutes - lastEtaMinutesRef.current) >= notificationSettings.etaThresholdMinutes
      ) {
        sendBrowserNotification("ETA updated", {
          body: `Your driver ETA changed by ${Math.abs(
            diffMinutes - lastEtaMinutesRef.current,
          )} minutes.`,
        });
      }

      lastEtaMinutesRef.current = diffMinutes;

      if (diffMinutes <= 5 && !driverNearbyNotifiedRef.current) {
        sendBrowserNotification("Driver is approaching", {
          body: "Your delivery is about 5 minutes away.",
        });
        driverNearbyNotifiedRef.current = true;
      }
    }

    if (
      (customerStop.status === "completed" || customerStop.status === "delivered") &&
      !deliveredNotifiedRef.current
    ) {
      sendBrowserNotification("Delivery completed", {
        body: "Your meal subscription has been delivered.",
      });
      deliveredNotifiedRef.current = true;
    }
  }, [customerStop, notificationSettings]);

  useEffect(() => {
    if (!customerStop?.photoUrl || customerStop.photoUrl.startsWith("http")) {
      return;
    }

    const photoPath = customerStop.photoUrl;

    fetch("/api/track/photo-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: customerStop.id, photo_path: photoPath }),
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok || !payload.data?.signed_url) {
          return;
        }

        setStops((prev) =>
          prev.map((stop) =>
            stop.id === customerStop.id ? { ...stop, photoUrl: payload.data.signed_url } : stop,
          ),
        );
      })
      .catch(() => undefined);
  }, [customerStop?.id, customerStop?.photoUrl]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleRefresh = async () => {
    router.refresh();
  };

  return (
    <>
      <DeliveryNotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6">
          <EtaDisplay
            estimatedArrival={customerStop?.estimatedArrival ?? null}
            totalStops={stopProgress.total}
            completedStops={stopProgress.completed}
            currentStopIndex={stopProgress.currentIndex}
            lastUpdated={lastUpdated}
            isReconnecting={connectionStatus === "reconnecting"}
          />

          <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Notification settings
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control browser alerts for delivery updates.
                </p>
              </div>
              {notificationsSupported ? (
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={notificationSettings.enabled}
                    onChange={(event) => {
                      const nextEnabled = event.target.checked;
                      if (!nextEnabled) {
                        setNotificationSettings((prev) => ({
                          ...prev,
                          enabled: false,
                        }));
                        return;
                      }

                      void requestNotificationPermission().then((permission) => {
                        if (permission !== "granted") {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            enabled: false,
                          }));
                          return;
                        }

                        setNotificationSettings((prev) => ({
                          ...prev,
                          enabled: true,
                        }));
                      });
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Enable browser notifications
                </label>
              ) : null}
            </div>

            {!notificationsSupported ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Browser notifications aren&apos;t supported in this browser.
              </p>
            ) : null}

            {notificationSettings.enabled ? (
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Do not disturb start
                  <input
                    type="time"
                    value={notificationSettings.dndStart}
                    onChange={(event) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        dndStart: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Do not disturb end
                  <input
                    type="time"
                    value={notificationSettings.dndEnd}
                    onChange={(event) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        dndEnd: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ETA change threshold (minutes)
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={notificationSettings.etaThresholdMinutes}
                    onChange={(event) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        etaThresholdMinutes: Number(event.target.value || 10),
                      }))
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
              </div>
            ) : null}

            {notificationSettings.enabled &&
            notificationsSupported &&
            Notification.permission === "denied" ? (
              <p className="mt-3 text-xs text-rose-600 dark:text-rose-300">
                Browser notifications are blocked. Enable them in your browser settings to
                receive alerts.
              </p>
            ) : null}
          </div>

          {isOffline ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              You&apos;re offline. Showing last known delivery status. Updates will resume
              when you&apos;re back online.
            </div>
          ) : connectionStatus === "error" ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              Live updates are temporarily unavailable. You can refresh this page to try
              again.
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
      </PullToRefresh>
    </>
  );
}

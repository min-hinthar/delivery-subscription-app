"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ButtonV2 } from "@/components/ui/button-v2";
import { Card } from "@/components/ui/card";
import {
  enqueueLocationUpdate,
  flushQueuedUpdates,
  getQueuedUpdateCount,
  type QueuedLocationUpdate,
} from "@/lib/driver/location-queue";
import { cn } from "@/lib/utils";

type LocationTrackerProps = {
  routeId: string;
  isActive: boolean;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const UPDATE_INTERVAL_MS = 10_000;
const PAUSE_AFTER_MS = 5 * 60 * 1000;
const MOVE_THRESHOLD_METERS = 12;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: Coordinates, b: Coordinates) {
  const radius = 6371e3;
  const phi1 = toRadians(a.latitude);
  const phi2 = toRadians(b.latitude);
  const deltaPhi = toRadians(b.latitude - a.latitude);
  const deltaLambda = toRadians(b.longitude - a.longitude);

  const delta =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(delta), Math.sqrt(1 - delta));
  return radius * c;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Waiting for first update";
  }
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function LocationTracker({ routeId, isActive }: LocationTrackerProps) {
  const [status, setStatus] = useState<"idle" | "tracking" | "paused" | "denied" | "error">(
    "idle",
  );
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isManualMode, setIsManualMode] = useState(false);

  const lastSentAtRef = useRef<number | null>(null);
  const lastPositionRef = useRef<Coordinates | null>(null);
  const lastMoveAtRef = useRef<number>(0);
  const isPausedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    setPendingCount(getQueuedUpdateCount(routeId));
  }, [routeId]);

  useEffect(() => {
    lastMoveAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const sendUpdate = useCallback(async (payload: QueuedLocationUpdate) => {
    try {
      const response = await fetch("/api/driver/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_id: payload.routeId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          heading: payload.heading,
          speed: payload.speed,
          accuracy: payload.accuracy,
        }),
      });

      if (!response.ok) {
        return false;
      }

      lastSentAtRef.current = Date.now();
      setLastUpdateAt(payload.capturedAt);
      return true;
    } catch {
      return false;
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (!isOnline || !isActive) {
      return;
    }
    const result = await flushQueuedUpdates(routeId, sendUpdate);
    setPendingCount(result.remaining);
  }, [isActive, isOnline, routeId, sendUpdate]);

  useEffect(() => {
    flushQueue();
  }, [flushQueue]);

  const handlePosition = useCallback(
    async (position: GeolocationPosition) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const speedKmh =
        position.coords.speed != null && Number.isFinite(position.coords.speed)
          ? Number(position.coords.speed) * 3.6
          : null;
      const headingValue =
        position.coords.heading != null && Number.isFinite(position.coords.heading)
          ? Number(position.coords.heading)
          : null;

      setAccuracy(position.coords.accuracy ?? null);
      setSpeed(speedKmh);
      setHeading(headingValue);
      setErrorMessage(null);

      const lastPosition = lastPositionRef.current;
      const now = Date.now();
      if (lastPosition) {
        const moved = distanceMeters(lastPosition, coords);
        if (moved > MOVE_THRESHOLD_METERS || (speedKmh ?? 0) > 1) {
          lastMoveAtRef.current = now;
          if (isPausedRef.current) {
            isPausedRef.current = false;
            setStatus("tracking");
          }
        }
      }

      if (now - lastMoveAtRef.current > PAUSE_AFTER_MS) {
        isPausedRef.current = true;
        setStatus("paused");
      }

      lastPositionRef.current = coords;

      if (!isActive) {
        setStatus("idle");
        return;
      }

      if (isPausedRef.current) {
        return;
      }

      const lastSentAt = lastSentAtRef.current;
      if (lastSentAt && now - lastSentAt < UPDATE_INTERVAL_MS) {
        return;
      }

      const payload: QueuedLocationUpdate = {
        routeId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: headingValue ?? undefined,
        speed: speedKmh ?? undefined,
        accuracy: position.coords.accuracy ?? undefined,
        capturedAt: new Date().toISOString(),
      };

      if (!isOnline) {
        const count = enqueueLocationUpdate(routeId, payload);
        setPendingCount(count);
        return;
      }

      const ok = await sendUpdate(payload);
      if (!ok) {
        const count = enqueueLocationUpdate(routeId, payload);
        setPendingCount(count);
      }
    },
    [isActive, isOnline, routeId, sendUpdate],
  );

  const startTracking = useCallback((): number | null => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported on this device.");
      return null;
    }

    setStatus("tracking");
    setIsManualMode(false);

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const watchId = navigator.geolocation.watchPosition(handlePosition, (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setStatus("denied");
        setIsManualMode(true);
        setErrorMessage("Location permission denied. Enable it to share your location.");
      } else {
        setStatus("error");
        setErrorMessage("Unable to access your location. Try again.");
      }
    });

    watchIdRef.current = watchId;
    return watchId;
  }, [handlePosition]);

  useEffect(() => {
    let watchId: number | null = null;

    if (isActive) {
      watchId = startTracking();
    } else {
      setStatus("idle");
    }

    return () => {
      if (watchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, startTracking]);

  const handleManualUpdate = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(handlePosition, () => {
      setErrorMessage("Unable to fetch location. Please try again.");
    });
  }, [handlePosition]);

  const statusLabel = useMemo(() => {
    if (!isActive) return "Route not started";
    if (!isOnline) return "Offline - queuing updates";
    if (status === "paused") return "Paused while stopped";
    if (status === "denied") return "Location permission needed";
    if (status === "error") return "Location error";
    return "Sharing live location";
  }, [isActive, isOnline, status]);

  return (
    <Card className="space-y-4 border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Live location
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Updates every 10 seconds while your route is active.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={cn(
              "rounded-full px-3 py-1",
              status === "error" || status === "denied"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                : status === "paused"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
            )}
          >
            {statusLabel}
          </span>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {pendingCount} queued
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Last update</div>
          <div>{formatTimestamp(lastUpdateAt)}</div>
        </div>
        <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Accuracy</div>
          <div>{accuracy ? `${Math.round(accuracy)}m` : "—"}</div>
        </div>
        <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Heading / Speed</div>
          <div>
            {heading != null ? `${Math.round(heading)}°` : "—"} ·{" "}
            {speed != null ? `${Math.round(speed)} km/h` : "—"}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      {isManualMode ? (
        <div className="flex flex-wrap gap-2">
          <ButtonV2 type="button" variant="outline" size="sm" onClick={handleManualUpdate}>
            Send manual update
          </ButtonV2>
          <ButtonV2 type="button" variant="ghost" size="sm" onClick={() => startTracking()}>
            Retry location access
          </ButtonV2>
        </div>
      ) : null}
    </Card>
  );
}

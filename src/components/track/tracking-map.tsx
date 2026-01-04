"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatedMarker } from "@/lib/maps/animated-marker";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TrackingStop, TrackingLocation } from "@/components/track/tracking-dashboard";
import { cacheTrackingData, getCachedTrackingData } from "@/lib/tracking/offline-cache";
import type { CachedDriverLocation } from "@/lib/tracking/offline-cache";

type GoogleMaps = typeof google;

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string, mapId?: string) {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if ((window as typeof window & { google?: GoogleMaps }).google?.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    const url = new URL("https://maps.googleapis.com/maps/api/js");
    url.searchParams.set("key", apiKey);
    if (mapId) {
      url.searchParams.set("map_ids", mapId);
    }
    url.searchParams.set("libraries", "geometry");
    script.src = url.toString();
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function maskLocation(value: number, precision: number = 0.001) {
  return Math.round(value / precision) * precision;
}

type TrackingMapProps = {
  routeId: string | null;
  polyline: string | null;
  customerLocation: { lat: number; lng: number } | null;
  stops: TrackingStop[];
  initialDriverLocation: TrackingLocation | null;
  showDriver: boolean;
  className?: string;
};

export function TrackingMap({
  routeId,
  polyline,
  customerLocation,
  stops,
  initialDriverLocation,
  showDriver,
  className,
}: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const truckMarkerRef = useRef<AnimatedMarker | null>(null);
  const completedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const remainingPolylineRef = useRef<google.maps.Polyline | null>(null);
  const routePathRef = useRef<google.maps.LatLng[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "error"
  >(routeId && showDriver ? "connecting" : "idle");
  const [autoTrackDriver, setAutoTrackDriver] = useState(true);
  const lastManualInteractionRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const mapError = useMemo(() => {
    if (!apiKey) {
      return "Missing NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.";
    }
    return null;
  }, [apiKey]);

  // Memoize map stops to avoid unnecessary re-renders
  const mapStops = useMemo(
    () =>
      stops
        .filter((stop) => stop.lat !== null && stop.lng !== null)
        .map((stop) => ({
          id: stop.id,
          stopOrder: stop.stopOrder,
          isCustomerStop: stop.isCustomerStop,
          lat: stop.lat ?? 0,
          lng: stop.lng ?? 0,
        })),
    [stops],
  );

  // For performance: limit visible stop markers on map to 25 closest to customer
  const visibleMapStops = useMemo(() => {
    if (mapStops.length <= 25 || !customerLocation) {
      return mapStops;
    }

    // Calculate distance from customer location and sort
    const stopsWithDistance = mapStops.map((stop) => {
      const latDiff = stop.lat - customerLocation.lat;
      const lngDiff = stop.lng - customerLocation.lng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      return { ...stop, distance };
    });

    // Sort by distance and take closest 25
    return stopsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 25)
      .map(({ distance, ...stop }) => stop);
  }, [mapStops, customerLocation]);

  const updateRouteProgress = useCallback((position: google.maps.LatLng) => {
    const path = routePathRef.current;
    if (path.length === 0 || !completedPolylineRef.current || !remainingPolylineRef.current) {
      return;
    }

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    path.forEach((point, index) => {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(position, point);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    completedPolylineRef.current.setPath(path.slice(0, Math.max(closestIndex + 1, 1)));
    remainingPolylineRef.current.setPath(path.slice(closestIndex));
  }, []);

  const smoothPanToPosition = useCallback((map: google.maps.Map, position: google.maps.LatLng) => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(position);

    // Add padding around the position for context
    const offset = 0.005; // ~500m padding
    bounds.extend(
      new google.maps.LatLng(position.lat() + offset, position.lng() + offset),
    );
    bounds.extend(
      new google.maps.LatLng(position.lat() - offset, position.lng() - offset),
    );

    // Smooth pan with animation
    map.panTo(position);

    // Adjust zoom if driver is getting close to edge
    const currentBounds = map.getBounds();
    if (!currentBounds?.contains(position)) {
      map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !apiKey) {
      return;
    }

    loadGoogleMaps(apiKey, mapId)
      .then(() => {
        if (!mapRef.current) {
          return;
        }

        if (mapInstanceRef.current) {
          return;
        }

        const googleMaps = (window as typeof window & { google?: GoogleMaps }).google;
        if (!googleMaps?.maps) {
          return;
        }

        const initialCenter = customerLocation
          ? new googleMaps.maps.LatLng(customerLocation.lat, customerLocation.lng)
          : new googleMaps.maps.LatLng(34.0522, -118.2437);

        const map = new googleMaps.maps.Map(mapRef.current, {
          mapId,
          center: initialCenter,
          zoom: 12,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
        });

        mapInstanceRef.current = map;

        // Detect user interaction to disable auto-tracking temporarily
        const handleUserInteraction = () => {
          lastManualInteractionRef.current = Date.now();
          setAutoTrackDriver(false);

          // Re-enable auto-tracking after 10 seconds of no interaction
          setTimeout(() => {
            const timeSinceLastInteraction = Date.now() - lastManualInteractionRef.current;
            if (timeSinceLastInteraction >= 10000) {
              setAutoTrackDriver(true);
            }
          }, 10000);
        };

        map.addListener("dragstart", handleUserInteraction);
        map.addListener("zoom_changed", () => {
          // Only count as interaction if user manually zoomed (not programmatic)
          const bounds = map.getBounds();
          if (bounds && !isInitialLoadRef.current) {
            handleUserInteraction();
          }
        });
      })
      .catch((caught) => {
        console.error(caught);
      });
  }, [apiKey, mapId, customerLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (customerLocation) {
      const customerMarker = new google.maps.Marker({
        map,
        position: customerLocation,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#166534",
          strokeWeight: 2,
        },
        title: "Your delivery location",
      });
      markersRef.current.push(customerMarker);
    }

    // Only show visible stops to improve performance with long routes
    visibleMapStops.forEach((stop) => {
      if (stop.isCustomerStop) {
        return;
      }

      const maskedLat = maskLocation(stop.lat);
      const maskedLng = maskLocation(stop.lng);

      const stopMarker = new google.maps.Marker({
        map,
        position: { lat: maskedLat, lng: maskedLng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: "#94a3b8",
          fillOpacity: 0.9,
          strokeColor: "#475569",
          strokeWeight: 1,
        },
        title: `Stop ${stop.stopOrder}`,
      });
      markersRef.current.push(stopMarker);
    });

    const bounds = new google.maps.LatLngBounds();
    markersRef.current.forEach((marker) => {
      const position = marker.getPosition();
      if (position) {
        bounds.extend(position);
      }
    });

    if (polyline) {
      const path = google.maps.geometry.encoding.decodePath(polyline);
      routePathRef.current = path;

      completedPolylineRef.current?.setMap(null);
      remainingPolylineRef.current?.setMap(null);

      completedPolylineRef.current = new google.maps.Polyline({
        map,
        path: path.slice(0, 1),
        strokeColor: "#22c55e",
        strokeOpacity: 0.9,
        strokeWeight: 6,
      });

      remainingPolylineRef.current = new google.maps.Polyline({
        map,
        path,
        strokeColor: "#94a3b8",
        strokeOpacity: 0.7,
        strokeWeight: 6,
      });

      path.forEach((point) => bounds.extend(point));
    }

    if (!bounds.isEmpty()) {
      // Smooth zoom animation on initial load, then allow auto-tracking
      if (isInitialLoadRef.current) {
        map.fitBounds(bounds, 60);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 1000);
      } else {
        map.fitBounds(bounds, 60);
      }
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      completedPolylineRef.current?.setMap(null);
      remainingPolylineRef.current?.setMap(null);
    };
  }, [customerLocation, visibleMapStops, polyline]);

  useEffect(() => {
    if (!routeId || !showDriver || !mapInstanceRef.current) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const updateTruck = (location: TrackingLocation) => {
      const map = mapInstanceRef.current;
      if (!map) {
        return;
      }

      const truckSymbol: google.maps.Symbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#f97316",
        fillOpacity: 0.95,
        strokeColor: "#9a3412",
        strokeWeight: 2,
      };

      const maskedLat = maskLocation(location.lat);
      const maskedLng = maskLocation(location.lng);
      const newPosition = new google.maps.LatLng(maskedLat, maskedLng);

      if (!truckMarkerRef.current) {
        truckMarkerRef.current = new AnimatedMarker(map, newPosition, truckSymbol);
        // Initial position - smooth zoom to show driver and route
        if (isInitialLoadRef.current) {
          setTimeout(() => smoothPanToPosition(map, newPosition), 500);
        }
      } else {
        // Adaptive animation - duration auto-calculated based on distance
        truckMarkerRef.current.animateTo(newPosition).catch(() => undefined);
      }

      updateRouteProgress(newPosition);

      // Auto-track driver position if enabled and not recently manually panned
      const timeSinceInteraction = Date.now() - lastManualInteractionRef.current;
      if (autoTrackDriver && timeSinceInteraction > 10000) {
        smoothPanToPosition(map, newPosition);
      }

      // Cache driver location for offline support
      if (routeId) {
        const cachedLocation: CachedDriverLocation = {
          lat: location.lat,
          lng: location.lng,
          heading: location.heading,
          updatedAt: location.updatedAt || new Date().toISOString(),
        };
        cacheTrackingData(routeId, cachedLocation, []);
      }
    };

    if (initialDriverLocation) {
      updateTruck(initialDriverLocation);
    }

    const channel = supabase
      .channel("driver-location")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `route_id=eq.${routeId}`,
        },
        (payload) => {
          const updated = payload.new as {
            latitude: number;
            longitude: number;
            heading: number | null;
            updated_at: string;
          };

          updateTruck({
            lat: updated.latitude,
            lng: updated.longitude,
            heading: updated.heading,
            updatedAt: updated.updated_at,
          });
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
      truckMarkerRef.current?.destroy();
      truckMarkerRef.current = null;
    };
  }, [initialDriverLocation, routeId, showDriver, updateRouteProgress]);

  if (mapError) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200",
          className,
        )}
      >
        {mapError}
      </div>
    );
  }

  if (!routeId) {
    return (
      <div
        className={cn(
          "flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
          className,
        )}
      >
        Tracking map will appear when your delivery is assigned to a route.
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={mapRef}
        data-testid="tracking-map"
        className="min-h-[360px] rounded-xl border border-slate-200 shadow-sm dark:border-slate-800"
      />
      {!showDriver ? (
        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          Driver location will appear once your delivery is in transit.
        </div>
      ) : null}
      {connectionStatus === "reconnecting" ? (
        <div className="absolute inset-x-4 top-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
          Reconnecting to live driver updates…
        </div>
      ) : null}
      {connectionStatus === "error" ? (
        <div className="absolute inset-x-4 top-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          Live driver updates are temporarily unavailable.
        </div>
      ) : null}
      {showDriver && !autoTrackDriver ? (
        <button
          onClick={() => {
            setAutoTrackDriver(true);
            lastManualInteractionRef.current = 0;
            if (truckMarkerRef.current && mapInstanceRef.current) {
              smoothPanToPosition(mapInstanceRef.current, truckMarkerRef.current.getPosition());
            }
          }}
          className="absolute bottom-4 right-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-md transition-all hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
        >
          Re-center on driver
        </button>
      ) : null}
    </div>
  );
}

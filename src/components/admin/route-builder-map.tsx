"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import type { RouteStop } from "@/components/admin/route-builder-types";

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

type RouteBuilderMapProps = {
  assignedStops: RouteStop[];
  unassignedStops: RouteStop[];
  polyline: string | null;
  className?: string;
};

export function RouteBuilderMap({
  assignedStops,
  unassignedStops,
  polyline,
  className,
}: RouteBuilderMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const hasStops = assignedStops.length > 0 || unassignedStops.length > 0;
  const error = useMemo(() => {
    if (!apiKey) {
      return "Missing NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.";
    }
    return null;
  }, [apiKey]);

  useEffect(() => {
    if (!mapRef.current || !apiKey || !hasStops) {
      return;
    }

    loadGoogleMaps(apiKey, mapId)
      .then(() => {
        const googleMaps = (window as typeof window & { google?: GoogleMaps }).google;
        if (!googleMaps?.maps || !mapRef.current) {
          return;
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new googleMaps.maps.Map(mapRef.current, {
            mapId,
            disableDefaultUI: true,
            zoomControl: true,
          });
        }

        const map = mapInstanceRef.current;
        const bounds = new googleMaps.maps.LatLngBounds();

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        if (polyline && googleMaps.maps.geometry?.encoding) {
          const path = googleMaps.maps.geometry.encoding.decodePath(polyline);
          path.forEach((point) => bounds.extend(point));
          polylineRef.current = new googleMaps.maps.Polyline({
            path,
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          polylineRef.current.setMap(map);
        }

        const geocoder = googleMaps.maps.Geocoder ? new googleMaps.maps.Geocoder() : null;
        const buildMarker = (
          stop: RouteStop,
          label: string,
          color: string,
        ) => {
          if (!geocoder || !stop.address) {
            return;
          }
          geocoder.geocode({ address: stop.address }, (results, status) => {
            if (status === "OK" && results?.[0]?.geometry?.location) {
              bounds.extend(results[0].geometry.location);
              const marker = new googleMaps.maps.Marker({
                map,
                position: results[0].geometry.location,
                label: {
                  text: label,
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: "600",
                },
                icon: {
                  path: googleMaps.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: color,
                  fillOpacity: 0.9,
                  strokeWeight: 1,
                  strokeColor: "#1e293b",
                },
              });
              markersRef.current.push(marker);
              map.fitBounds(bounds, 60);
            }
          });
        };

        assignedStops.forEach((stop, index) => {
          buildMarker(stop, String(index + 1), "#93c5fd");
        });

        unassignedStops.forEach((stop) => {
          buildMarker(stop, "U", "#e2e8f0");
        });
      })
      .catch((caught) => {
        console.error(caught);
      });
  }, [apiKey, mapId, assignedStops, unassignedStops, polyline, hasStops]);

  if (!hasStops) {
    return (
      <div
        className={cn(
          "flex h-72 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900",
          className,
        )}
      >
        Add stops to see the route map.
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex h-72 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200",
          className,
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cn(
        "h-72 rounded-lg border border-slate-200 shadow-sm dark:border-slate-800",
        className,
      )}
    />
  );
}

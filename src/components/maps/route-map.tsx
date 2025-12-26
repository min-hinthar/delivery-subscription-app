"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

type GoogleMaps = {
  maps: {
    geometry: {
      encoding: {
        decodePath: (value: string) => Array<{ lat: () => number; lng: () => number }>;
      };
    };
    LatLngBounds: new () => { extend: (point: { lat: () => number; lng: () => number }) => void };
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>,
    ) => { fitBounds: (bounds: unknown, padding?: number) => void };
    Polyline: new (
      options: Record<string, unknown>,
    ) => { setMap: (map: { fitBounds: (bounds: unknown, padding?: number) => void }) => void };
  };
};

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

type RouteMapProps = {
  polyline: string | null;
  className?: string;
};

export function RouteMap({ polyline, className }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const error = useMemo(() => {
    if (!apiKey) {
      return "Missing NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.";
    }
    return null;
  }, [apiKey]);

  useEffect(() => {
    if (!polyline || !mapRef.current) {
      return;
    }

    if (!apiKey) {
      return;
    }

    loadGoogleMaps(apiKey, mapId)
      .then(() => {
        const googleMaps = (window as typeof window & { google?: GoogleMaps }).google;

        if (!mapRef.current || !googleMaps?.maps) {
          return;
        }

        const path = googleMaps.maps.geometry.encoding.decodePath(polyline);
        const bounds = new googleMaps.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));

        const map = new googleMaps.maps.Map(mapRef.current, {
          mapId,
          disableDefaultUI: true,
          zoomControl: true,
        });

        const routePath = new googleMaps.maps.Polyline({
          path,
          strokeColor: "#2563eb",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        });

        routePath.setMap(map);
        map.fitBounds(bounds, 40);
      })
      .catch((caught) => {
        console.error(caught);
      });
  }, [apiKey, mapId, polyline]);

  if (!polyline) {
    return (
      <div className={cn(
        "flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}>
        Route map will appear once directions are built.
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex h-64 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200",
        className,
      )}>
        {error}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cn(
        "h-64 rounded-lg border border-slate-200 shadow-sm dark:border-slate-800",
        className,
      )}
    />
  );
}

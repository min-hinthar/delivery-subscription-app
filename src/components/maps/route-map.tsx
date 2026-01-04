"use client";

import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

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

type RouteMapProps = {
  polyline: string | null;
  className?: string;
  stops?: Array<{ label: string; address: string }>;
};

export function RouteMap({ polyline, className, stops }: RouteMapProps) {
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
    if (!mapRef.current) {
      return;
    }

    if (!apiKey) {
      return;
    }

    if (!polyline && (!stops || stops.length === 0)) {
      return;
    }

    loadGoogleMaps(apiKey, mapId)
      .then(() => {
        const googleMaps = (window as typeof window & { google?: GoogleMaps }).google;

        if (!mapRef.current || !googleMaps?.maps) {
          return;
        }

        const map = new googleMaps.maps.Map(mapRef.current, {
          mapId,
          disableDefaultUI: true,
          zoomControl: true,
        });

        const bounds = new googleMaps.maps.LatLngBounds();

        if (polyline) {
          const path = googleMaps.maps.geometry.encoding.decodePath(polyline);
          path.forEach((point) => bounds.extend(point));

          const routePath = new googleMaps.maps.Polyline({
            path,
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });

          routePath.setMap(map);
        }

        if (stops && stops.length > 0 && googleMaps.maps.Geocoder) {
          const geocoder = new googleMaps.maps.Geocoder();
          stops.forEach((stop) => {
            if (!stop.address) {
              return;
            }
            geocoder.geocode({ address: stop.address }, (results, status) => {
              if (status === "OK" && results?.[0]?.geometry?.location) {
                bounds.extend(results[0].geometry.location);
                new googleMaps.maps.Marker({
                  map,
                  position: results[0].geometry.location,
                  label: stop.label,
                });
                map.fitBounds(bounds, 40);
              }
            });
          });
        }

        if (polyline) {
          map.fitBounds(bounds, 40);
        }
      })
      .catch((caught) => {
        console.error(caught);
      });
  }, [apiKey, mapId, polyline, stops]);

  if (!polyline && (!stops || stops.length === 0)) {
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

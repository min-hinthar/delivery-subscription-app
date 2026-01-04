/**
 * Offline cache for tracking data
 *
 * Stores last known driver location and delivery stops in localStorage
 * to provide offline UX when Realtime connection is lost
 */

export type CachedDriverLocation = {
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: string;
};

export type CachedDeliveryStop = {
  id: string;
  stopOrder: number;
  status: string;
  estimatedArrival: string | null;
  completedAt: string | null;
};

export type CachedTrackingData = {
  routeId: string;
  driverLocation: CachedDriverLocation | null;
  stops: CachedDeliveryStop[];
  lastCached: string;
};

const CACHE_KEY_PREFIX = "tracking_cache_";
const CACHE_EXPIRY_MS = 3600000; // 1 hour

function getCacheKey(routeId: string): string {
  return `${CACHE_KEY_PREFIX}${routeId}`;
}

export function cacheTrackingData(
  routeId: string,
  driverLocation: CachedDriverLocation | null,
  stops: CachedDeliveryStop[],
): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    const data: CachedTrackingData = {
      routeId,
      driverLocation,
      stops,
      lastCached: new Date().toISOString(),
    };

    localStorage.setItem(getCacheKey(routeId), JSON.stringify(data));
  } catch (error) {
    // Silently fail - caching is a nice-to-have, not critical
    console.warn("Failed to cache tracking data:", error);
  }
}

export function getCachedTrackingData(routeId: string): CachedTrackingData | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    const cached = localStorage.getItem(getCacheKey(routeId));
    if (!cached) {
      return null;
    }

    const data = JSON.parse(cached) as CachedTrackingData;

    // Check if cache is expired
    const cacheAge = Date.now() - new Date(data.lastCached).getTime();
    if (cacheAge > CACHE_EXPIRY_MS) {
      clearCachedTrackingData(routeId);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to retrieve cached tracking data:", error);
    return null;
  }
}

export function clearCachedTrackingData(routeId: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    localStorage.removeItem(getCacheKey(routeId));
  } catch (error) {
    console.warn("Failed to clear cached tracking data:", error);
  }
}

export function clearAllTrackingCaches(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to clear all tracking caches:", error);
  }
}

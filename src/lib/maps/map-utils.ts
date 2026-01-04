/**
 * Initialize Google Map with custom Burmese-inspired styling
 */
export function createStyledMap(
  container: HTMLElement,
  mapId: string,
  options?: google.maps.MapOptions,
): google.maps.Map {
  const defaultOptions: google.maps.MapOptions = {
    center: { lat: 16.8661, lng: 96.1951 }, // Yangon, Myanmar
    zoom: 12,
    mapId, // Custom styling
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    ...options,
  };

  return new google.maps.Map(container, defaultOptions);
}

/**
 * Parse Google Places Autocomplete result
 */
export function parseAddressComponents(
  place: google.maps.places.PlaceResult,
): {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
} {
  const components = place.address_components || [];

  const getComponent = (type: string): string => {
    const comp = components.find((c) => c.types.includes(type));
    return comp?.long_name || "";
  };

  const street = [getComponent("street_number"), getComponent("route")]
    .filter(Boolean)
    .join(" ");

  return {
    street,
    city: getComponent("locality") || getComponent("sublocality"),
    state: getComponent("administrative_area_level_1"),
    zip: getComponent("postal_code"),
    lat: place.geometry?.location?.lat() || 0,
    lng: place.geometry?.location?.lng() || 0,
  };
}

/**
 * Validate latitude and longitude values
 */
function validateCoordinates(lat: number, lng: number, label: string = "coordinate"): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Invalid ${label}: latitude and longitude must be finite numbers`);
  }
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid ${label}: latitude must be between -90 and 90, got ${lat}`);
  }
  if (lng < -180 || lng > 180) {
    throw new Error(`Invalid ${label}: longitude must be between -180 and 180, got ${lng}`);
  }
}

/**
 * Normalize longitude to [-180, 180] range
 */
function normalizeLongitude(lng: number): number {
  // Handle values outside [-180, 180] by wrapping
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

/**
 * Calculate distance between two points (Haversine formula)
 * Handles edge cases: poles, antimeridian crossing, and input validation
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  // Validate inputs
  validateCoordinates(lat1, lng1, "point 1");
  validateCoordinates(lat2, lng2, "point 2");

  // Normalize longitudes to handle antimeridian crossing
  const lng1Norm = normalizeLongitude(lng1);
  const lng2Norm = normalizeLongitude(lng2);

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;

  // Handle antimeridian crossing: use the shorter path
  let Δλ = lng2Norm - lng1Norm;
  if (Math.abs(Δλ) > 180) {
    Δλ = Δλ > 0 ? Δλ - 360 : Δλ + 360;
  }
  Δλ = (Δλ * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

import "server-only";

type GeocodeResult = {
  formattedAddress: string;
  location: { lat: number; lng: number };
  components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    country?: string;
  };
};

type GeocodeApiComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocodeApiResult = {
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  address_components: GeocodeApiComponent[];
};

type DirectionsResult = {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  legs: Array<{
    distanceMeters: number;
    durationSeconds: number;
    startAddress: string;
    endAddress: string;
  }>;
  waypointOrder?: number[];
};

function getGoogleMapsKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY.");
  }

  return apiKey;
}

function buildAddress(components: GeocodeResult["components"]) {
  const street = [components.streetNumber, components.route].filter(Boolean).join(" ");

  return {
    line1: street || undefined,
    city: components.locality,
    state: components.administrativeArea,
    postalCode: components.postalCode,
    country: components.country,
  };
}

function parseGeocodeResult(result: GeocodeApiResult): GeocodeResult {
  const components: GeocodeResult["components"] = {};

  for (const component of result.address_components ?? []) {
    if (component.types?.includes("street_number")) {
      components.streetNumber = component.long_name;
    }
    if (component.types?.includes("route")) {
      components.route = component.long_name;
    }
    if (component.types?.includes("locality")) {
      components.locality = component.long_name;
    }
    if (component.types?.includes("administrative_area_level_1")) {
      components.administrativeArea = component.short_name;
    }
    if (component.types?.includes("postal_code")) {
      components.postalCode = component.long_name;
    }
    if (component.types?.includes("country")) {
      components.country = component.short_name;
    }
  }

  return {
    formattedAddress: result.formatted_address,
    location: result.geometry?.location,
    components,
  };
}

type GeocodeApiResponse = {
  status: string;
  error_message?: string;
  results: GeocodeApiResult[];
};

export async function geocodeAddress(address: string) {
  const apiKey = getGoogleMapsKey();
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = (await response.json()) as GeocodeApiResponse;

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(data.error_message || "Unable to geocode address.");
  }

  return parseGeocodeResult(data.results[0]);
}

type DirectionsApiLeg = {
  distance?: { value?: number };
  duration?: { value?: number };
  start_address: string;
  end_address: string;
};

type DirectionsApiRoute = {
  overview_polyline?: { points?: string };
  legs?: DirectionsApiLeg[];
  waypoint_order?: number[];
};

type DirectionsApiResponse = {
  status: string;
  error_message?: string;
  routes: DirectionsApiRoute[];
};

export async function directionsRoute(options: {
  origin: string;
  destination: string;
  waypoints?: string[];
  optimizeWaypoints?: boolean;
}) {
  const apiKey = getGoogleMapsKey();
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", options.origin);
  url.searchParams.set("destination", options.destination);
  url.searchParams.set("key", apiKey);

  if (options.waypoints && options.waypoints.length > 0) {
    const waypointPrefix = options.optimizeWaypoints ? "optimize:true|" : "";
    url.searchParams.set("waypoints", `${waypointPrefix}${options.waypoints.join("|")}`);
  }

  const response = await fetch(url.toString());
  const data = (await response.json()) as DirectionsApiResponse;

  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(data.error_message || "Unable to build directions route.");
  }

  const route = data.routes[0];
  const legs = (route.legs ?? []).map((leg) => ({
    distanceMeters: leg.distance?.value ?? 0,
    durationSeconds: leg.duration?.value ?? 0,
    startAddress: leg.start_address,
    endAddress: leg.end_address,
  }));
  const distanceMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const durationSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);

  const result: DirectionsResult = {
    polyline: route.overview_polyline?.points ?? "",
    distanceMeters,
    durationSeconds,
    legs,
    waypointOrder: route.waypoint_order,
  };

  return result;
}

export function applyCanonicalAddress(result: GeocodeResult) {
  const address = buildAddress(result.components);

  return {
    line1: address.line1 ?? result.formattedAddress,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: address.country ?? "US",
  };
}

export function toPrintableAddress(fields: {
  line1: string | null;
  line2?: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}) {
  return [
    fields.line1,
    fields.line2,
    [fields.city, fields.state, fields.postal_code].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(", ");
}

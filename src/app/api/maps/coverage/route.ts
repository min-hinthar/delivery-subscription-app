import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { directionsRoute, geocodeAddress } from "@/lib/maps/google";
import { KITCHEN_ORIGIN } from "@/lib/maps/route";
import { rateLimit } from "@/lib/security/rate-limit";

const coverageSchema = z.object({
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be 5 digits (optionally +4)."),
});

type CoverageResponse = {
  eligible: boolean;
  reason: string;
  county?: string;
  formatted_address?: string;
  distance_miles?: number;
  duration_minutes?: number;
};

type CacheEntry = {
  data: CoverageResponse;
  expiresAt: number;
};

const coverageCache = new Map<string, CacheEntry>();

function getCoverageConfig() {
  const allowed = process.env.COVERAGE_ALLOWED_COUNTIES;
  const maxDistance = Number.parseFloat(
    process.env.COVERAGE_MAX_DISTANCE_MILES ?? "",
  );
  const maxDuration = Number.parseFloat(
    process.env.COVERAGE_MAX_DURATION_MINUTES ?? "",
  );
  const cacheMinutes = Number.parseFloat(
    process.env.COVERAGE_CACHE_TTL_MINUTES ?? "15",
  );

  if (!allowed) {
    throw new Error("Missing COVERAGE_ALLOWED_COUNTIES.");
  }

  if (!Number.isFinite(maxDistance) || maxDistance <= 0) {
    throw new Error("Missing COVERAGE_MAX_DISTANCE_MILES.");
  }

  if (!Number.isFinite(maxDuration) || maxDuration <= 0) {
    throw new Error("Missing COVERAGE_MAX_DURATION_MINUTES.");
  }

  const allowedCountiesDisplay = allowed
    .split(",")
    .map((county) => county.trim())
    .filter(Boolean);

  const allowedCounties = allowedCountiesDisplay.map((county) =>
    county.replace(/\s+county$/i, "").toLowerCase(),
  );

  if (allowedCounties.length === 0 || allowedCountiesDisplay.length === 0) {
    throw new Error("COVERAGE_ALLOWED_COUNTIES is empty.");
  }

  return {
    allowedCounties,
    allowedCountiesDisplay,
    maxDistance,
    maxDuration,
    cacheTtlMs: Math.max(1, cacheMinutes) * 60_000,
  };
}

function getCached(zip: string) {
  const cached = coverageCache.get(zip);
  if (!cached) {
    return null;
  }
  if (Date.now() > cached.expiresAt) {
    coverageCache.delete(zip);
    return null;
  }
  return cached.data;
}

function setCached(zip: string, data: CoverageResponse, ttlMs: number) {
  coverageCache.set(zip, { data, expiresAt: Date.now() + ttlMs });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function normalizeCounty(county?: string) {
  return county?.replace(/\s+county$/i, "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const rate = rateLimit({
    key: `maps:coverage:${getClientIp(request)}`,
    max: 5,
    windowMs: 60_000,
  });

  if (!rate.allowed) {
    return bad("Too many coverage checks. Please wait and try again.", {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
      },
    });
  }

  const body = await request.json().catch(() => null);
  const parsed = coverageSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Enter a valid ZIP code.", { status: 422 });
  }

  const zip = parsed.data.zip.replace(/\s+/g, "");
  const cached = getCached(zip);
  if (cached) {
    return ok(cached, { headers: { "Cache-Control": "no-store" } });
  }

  let config;
  try {
    config = getCoverageConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coverage configuration error.";
    return bad(message, { status: 500 });
  }

  try {
    const geocode = await geocodeAddress(zip);
    const county = normalizeCounty(geocode.components.county);

    if (!county) {
      const data: CoverageResponse = {
        eligible: false,
        reason: "We could not determine a delivery county for that ZIP code.",
        formatted_address: geocode.formattedAddress,
      };
      setCached(zip, data, config.cacheTtlMs);
      return ok(data, { headers: { "Cache-Control": "no-store" } });
    }

    if (!config.allowedCounties.includes(county)) {
      const data: CoverageResponse = {
        eligible: false,
        reason: `We only deliver within ${config.allowedCountiesDisplay
          .map((entry) => (entry.match(/county/i) ? entry : `${entry} County`))
          .join(", ")}.`,
        county: geocode.components.county,
        formatted_address: geocode.formattedAddress,
      };
      setCached(zip, data, config.cacheTtlMs);
      return ok(data, { headers: { "Cache-Control": "no-store" } });
    }

    const route = await directionsRoute({
      origin: KITCHEN_ORIGIN,
      destination: geocode.formattedAddress,
    });

    const distanceMiles = route.distanceMeters / 1609.344;
    const durationMinutes = route.durationSeconds / 60;

    const isWithinRange =
      distanceMiles <= config.maxDistance && durationMinutes <= config.maxDuration;

    const data: CoverageResponse = {
      eligible: isWithinRange,
      reason: isWithinRange
        ? "Great news — weekly delivery is available in your area."
        : "That ZIP code is outside our delivery radius right now.",
      county: geocode.components.county,
      formatted_address: geocode.formattedAddress,
      distance_miles: Number(distanceMiles.toFixed(1)),
      duration_minutes: Number(durationMinutes.toFixed(0)),
    };

    setCached(zip, data, config.cacheTtlMs);

    return ok(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check coverage.";
    return bad(message, { status: 422 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/security/rate-limit";
import { SimpleCache, generateCacheKey } from "@/lib/cache/simple-cache";

const directionsSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  waypoints: z.array(z.string()).optional(),
  optimize: z.boolean().optional(),
});

const privateHeaders = { "Cache-Control": "no-store" };

// Cache directions for 15 minutes (same route is likely to be requested multiple times)
const directionsCache = new SimpleCache<unknown>(15 * 60 * 1000);

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const rate = rateLimit({
      key: `maps:directions:${getClientIp(request)}`,
      max: 12,
      windowMs: 60_000,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many directions requests. Please try again shortly.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rate.resetMs / 1000).toString(),
            ...privateHeaders,
          },
        },
      );
    }

    const body = await request.json();
    const params = directionsSchema.parse(body);

    // Check cache first
    const cacheKey = generateCacheKey({
      origin: params.origin,
      destination: params.destination,
      waypoints: params.waypoints ?? [],
      optimize: params.optimize ?? false,
    });

    const cachedData = directionsCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(
        { ok: true, data: cachedData, cached: true },
        { status: 200, headers: privateHeaders }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MISSING_API_KEY",
            message: "Google Maps server key is not configured.",
          },
        },
        { status: 500, headers: privateHeaders },
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", params.origin);
    url.searchParams.set("destination", params.destination);
    url.searchParams.set("key", apiKey);

    if (params.waypoints && params.waypoints.length > 0) {
      const waypointsParam = params.optimize
        ? `optimize:true|${params.waypoints.join("|")}`
        : params.waypoints.join("|");
      url.searchParams.set("waypoints", waypointsParam);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("[Directions API] Google Maps API error:", {
        status: data.status,
        error_message: data.error_message,
        params: { origin: params.origin, destination: params.destination },
      });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DIRECTIONS_ERROR",
            message: data.error_message || "Failed to get directions from Google Maps",
            details: data.status,
          },
        },
        { status: 400, headers: privateHeaders },
      );
    }

    // Cache the successful response
    directionsCache.set(cacheKey, data);

    return NextResponse.json({ ok: true, data, cached: false }, { status: 200, headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 422, headers: privateHeaders },
      );
    }

    console.error("Directions API error:", error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch directions" } },
      { status: 500, headers: privateHeaders },
    );
  }
}

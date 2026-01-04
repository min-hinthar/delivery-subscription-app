import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/security/rate-limit";

const directionsSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  waypoints: z.array(z.string()).optional(),
  optimize: z.boolean().optional(),
});

const privateHeaders = { "Cache-Control": "no-store" };

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
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DIRECTIONS_ERROR",
            message: data.error_message || "Failed to get directions",
          },
        },
        { status: 400, headers: privateHeaders },
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200, headers: privateHeaders });
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

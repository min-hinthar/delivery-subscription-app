import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { calculateRouteEtas } from "@/lib/maps/calculate-eta";

const locationSchema = z.object({
  route_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(359.99).optional(), // 0-359.99 degrees (360 === 0)
  speed: z.number().min(0).optional(), // km/h
  accuracy: z.number().min(0).optional(), // meters
});

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401, headers: privateHeaders },
      );
    }

    // Apply rate limiting (60 updates per minute per driver)
    const rate = rateLimit({
      key: `driver:location:${user.id}`,
      max: 60,
      windowMs: 60_000,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many location updates. Please slow down.",
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

    // Parse and validate request
    const body = await request.json();
    const location = locationSchema.parse(body);

    // Verify route exists and driver is assigned to it
    const { data: route, error: routeError } = await supabase
      .from("delivery_routes")
      .select("id, driver_id")
      .eq("id", location.route_id)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found or you do not have access to it",
          },
        },
        { status: 404, headers: privateHeaders },
      );
    }

    // Verify driver is assigned to this route
    if (route.driver_id !== user.id) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "You are not assigned to this route",
          },
        },
        { status: 403, headers: privateHeaders },
      );
    }

    // Upsert driver location
    const { details: { error: upsertError  }} = await supabase.from("driver_locations").upsert(
      {
        driver_id: user.id,
        route_id: location.route_id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "driver_id,route_id",
      },
    );

    if (upsertError) {
      console.error("[Driver Location API] Failed to update location:", {
        driver_id: user.id,
        route_id: location.route_id,
        error: upsertError,
      });
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update location. Please try again.",
          },
        },
        { status: 500, headers: privateHeaders },
      );
    }

    try {
      await calculateRouteEtas({ routeId: location.route_id });
    } catch (etaError) {
      console.error("[Driver Location API] ETA recalculation failed:", {
        route_id: location.route_id,
        error: etaError instanceof Error ? etaError.message : etaError,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: privateHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid location data",
            details: error.errors,
          },
        },
        { status: 422, headers: privateHeaders },
      );
    }

    console.error("[Driver Location API] Unexpected error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500, headers: privateHeaders },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  route_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  accuracy: z.number().min(0).optional(),
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

    // Parse and validate request
    const body = await request.json();
    const location = locationSchema.parse(body);

    // Upsert driver location
    const { error: upsertError } = await supabase.from("driver_locations").upsert(
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
      console.error("Failed to update driver location:", upsertError);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "DATABASE_ERROR", message: "Failed to update location" },
        },
        { status: 500, headers: privateHeaders },
      );
    }

    // TODO: Trigger ETA recalculation (PR #11)

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

    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500, headers: privateHeaders },
    );
  }
}

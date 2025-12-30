import { z } from "zod";

import { bad, ok } from "@/lib/api/response";
import { isAfterCutoff } from "@/lib/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const appointmentSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  delivery_window_id: z.string().uuid(),
  address_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return bad("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid appointment payload.", { status: 422 });
  }

  const weekOfDate = new Date(`${parsed.data.week_of}T00:00:00Z`);

  if (Number.isNaN(weekOfDate.getTime())) {
    return bad("Invalid week_of date.", { status: 422 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin && isAfterCutoff(weekOfDate)) {
    return bad("The Friday 5PM PT cutoff has passed for this week.", { status: 403 });
  }

  const { data: window } = await supabase
    .from("delivery_windows")
    .select("id, capacity, is_active")
    .eq("id", parsed.data.delivery_window_id)
    .maybeSingle();

  if (!window || !window.is_active) {
    return bad("Selected delivery window is unavailable.", { status: 404 });
  }

  const { data: appointments } = await supabase
    .from("delivery_appointments")
    .select("id")
    .eq("week_of", parsed.data.week_of)
    .eq("delivery_window_id", parsed.data.delivery_window_id);

  if ((appointments?.length ?? 0) >= window.capacity) {
    return bad("Selected delivery window is full.", { status: 409 });
  }

  let addressId = parsed.data.address_id ?? null;

  if (addressId) {
    const { data: address } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", addressId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (!address?.id) {
      return bad("Address not available.", { status: 403 });
    }
  } else {
    addressId =
      (await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("is_primary", true)
        .maybeSingle()).data?.id ?? null;
  }

  const { data: appointment, error } = await supabase
    .from("delivery_appointments")
    .upsert(
      {
        user_id: auth.user.id,
        week_of: parsed.data.week_of,
        delivery_window_id: parsed.data.delivery_window_id,
        address_id: addressId,
        notes: parsed.data.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_of" },
    )
    .select("id, week_of, delivery_window_id, status")
    .maybeSingle();

  if (error) {
    return bad("Failed to save appointment.", { status: 500 });
  }

  return ok({ appointment });
}

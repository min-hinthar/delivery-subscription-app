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
const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth.user) {
    return bad("Unauthorized", { status: 401, headers: privateHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return bad("Invalid appointment payload.", { status: 422, headers: privateHeaders });
  }

  const weekOfDate = new Date(`${parsed.data.week_of}T00:00:00Z`);

  if (Number.isNaN(weekOfDate.getTime())) {
    return bad("Invalid week_of date.", { status: 422, headers: privateHeaders });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    return bad("Failed to fetch user profile.", { status: 500, headers: privateHeaders, details: { error: profileError.message } });
  }

  if (!profile?.is_admin && isAfterCutoff(weekOfDate)) {
    return bad("The Friday 5PM PT cutoff has passed for this week.", {
      status: 403,
      headers: privateHeaders,
    });
  }

  const { data: window, error: windowError } = await supabase
    .from("delivery_windows")
    .select("id, capacity, is_active")
    .eq("id", parsed.data.delivery_window_id)
    .maybeSingle();

  if (windowError) {
    console.error('Failed to fetch delivery window:', windowError);
    return bad("Failed to fetch delivery window.", { status: 500, headers: privateHeaders, details: { error: windowError.message } });
  }

  if (!window || !window.is_active) {
    return bad("Selected delivery window is unavailable.", {
      status: 404,
      headers: privateHeaders,
    });
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("delivery_appointments")
    .select("id")
    .eq("week_of", parsed.data.week_of)
    .eq("delivery_window_id", parsed.data.delivery_window_id);

  if (appointmentsError) {
    console.error('Failed to fetch appointments:', appointmentsError);
    return bad("Failed to fetch appointments.", { status: 500, headers: privateHeaders, details: { error: appointmentsError.message } });
  }

  if ((appointments?.length ?? 0) >= window.capacity) {
    return bad("Selected delivery window is full.", { status: 409, headers: privateHeaders });
  }

  let addressId = parsed.data.address_id ?? null;

  if (addressId) {
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", addressId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (addressError) {
      console.error('Failed to fetch address:', addressError);
      return bad("Failed to fetch address.", { status: 500, headers: privateHeaders, details: { error: addressError.message } });
    }

    if (!address?.id) {
      return bad("Address not available.", { status: 403, headers: privateHeaders });
    }
  } else {
    const { data: primaryAddress, error: primaryAddressError } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (primaryAddressError) {
      console.error('Failed to fetch primary address:', primaryAddressError);
      return bad("Failed to fetch primary address.", { status: 500, headers: privateHeaders, details: { error: primaryAddressError.message } });
    }

    addressId = primaryAddress?.id ?? null;
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
    console.error('Failed to save appointment:', error);
    return bad("Failed to save appointment.", { status: 500, headers: privateHeaders, details: { error: error.message } });
  }

  return ok({ appointment }, { headers: privateHeaders });
}

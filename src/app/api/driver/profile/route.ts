import { bad, ok } from "@/lib/api/response";
import { requireDriver } from "@/lib/auth/driver";
import { driverProfileSchema, type DriverProfileInput } from "@/lib/validation/driver";

const privateHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const { supabase, user, driver } = await requireDriver();

  if (!user) {
    return bad("Authentication required.", { status: 401, headers: privateHeaders });
  }

  if (!driver) {
    return bad("Driver access required.", { status: 403, headers: privateHeaders });
  }

  if (driver.status === "suspended") {
    return bad("Driver account suspended.", { status: 403, headers: privateHeaders });
  }

  let payload: DriverProfileInput;

  try {
    payload = driverProfileSchema.parse(await request.json());
  } catch (error) {
    return bad("Invalid driver profile.", { status: 422, details: error, headers: privateHeaders });
  }

  const { data: updatedProfile, error } = await supabase
    .from("driver_profiles")
    .update({
      full_name: payload.full_name,
      phone: payload.phone,
      vehicle_make: payload.vehicle_make || null,
      vehicle_model: payload.vehicle_model || null,
      vehicle_color: payload.vehicle_color || null,
      license_plate: payload.license_plate || null,
      status: "active",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id, email, full_name, phone, status")
    .maybeSingle();

  if (error || !updatedProfile) {
    return bad("Unable to update driver profile.", { status: 500, headers: privateHeaders });
  }

  await supabase
    .from("profiles")
    .update({ is_driver: true })
    .eq("id", user.id);

  return ok({ profile: updatedProfile }, { headers: privateHeaders });
}

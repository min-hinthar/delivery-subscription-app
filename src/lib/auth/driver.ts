import { createSupabaseServerClient } from "@/lib/supabase/server";

type DriverProfile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: "pending" | "active" | "suspended" | string;
};

export async function requireDriver() {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { supabase, user: null, driver: null };
  }

  const { data: driver } = await supabase
    .from("driver_profiles")
    .select("id, email, full_name, phone, status")
    .eq("id", data.user.id)
    .maybeSingle();

  return { supabase, user: data.user, driver: driver as DriverProfile | null };
}

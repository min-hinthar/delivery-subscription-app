import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  return { supabase, user: data.user, isAdmin: Boolean(profile?.is_admin) };
}

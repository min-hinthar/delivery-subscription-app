import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  return { user: data.user, isAdmin: Boolean(profile?.is_admin) };
}

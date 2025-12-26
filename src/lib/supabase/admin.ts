import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceConfig } from "./env";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServiceConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

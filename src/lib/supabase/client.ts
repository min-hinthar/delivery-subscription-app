import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let _browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_browserClient) return _browserClient;
  const { url, anonKey } = getSupabaseConfig();
  _browserClient = createClient(url, anonKey);
  return _browserClient;
}

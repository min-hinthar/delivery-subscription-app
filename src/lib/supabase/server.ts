import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabaseConfig } from "./env";

type SupabaseServerOptions = {
  allowSetCookies?: boolean;
};

export async function createSupabaseServerClient(
  options: SupabaseServerOptions = {},
) {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  const allowSetCookies = options.allowSetCookies ?? false;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>,
      ) {
        if (!allowSetCookies) {
          return;
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set({ name, value, ...options });
        });
      },
    },
  });
}

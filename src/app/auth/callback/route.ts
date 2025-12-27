import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (!code) {
    const redirectUrl = new URL("/login", url.origin);
    if (errorCode) {
      redirectUrl.searchParams.set("error", errorCode);
    }
    if (errorDescription) {
      redirectUrl.searchParams.set("message", errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createSupabaseServerClient({ allowSetCookies: true });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("error", error.name ?? "auth_error");
    redirectUrl.searchParams.set("message", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?reason=auth&next=${encodeURIComponent("/account")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Admin bypass: operations accounts can proceed without customer onboarding.
  if (profile?.is_admin) {
    return <>{children}</>;
  }

  const { data: primaryAddress } = await supabase
    .from("addresses")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (!profile?.onboarding_completed || !primaryAddress?.id) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}

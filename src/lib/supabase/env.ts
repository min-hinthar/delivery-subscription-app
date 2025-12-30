type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseServiceConfig = {
  url: string;
  serviceRoleKey: string;
};

function isCodexVerify(): boolean {
  return process.env.CODEX_VERIFY === "1";
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (val) return val;

  // Allow build/verify to proceed with stub env.
  if (isCodexVerify()) return `stub_${name}`;

  throw new Error(`Missing required environment variable: ${name}`);
}

export function getSupabaseConfig(): SupabaseConfig {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    (isCodexVerify() ? "https://example.supabase.co" : undefined);

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (isCodexVerify() ? requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") : undefined);

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    (isCodexVerify() ? "https://example.supabase.co" : undefined);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? (isCodexVerify() ? requireEnv("SUPABASE_SERVICE_ROLE_KEY") : undefined);

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}

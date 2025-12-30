#!/usr/bin/env bash
set -euo pipefail

# Inject safe stub values only if missing.
# Never put real secrets in this file.
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stub}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-stub_service_role_key}"

# Signal that we are in "verify mode" so runtime env validation can relax for build checks.
export CODEX_VERIFY="${CODEX_VERIFY:-1}"

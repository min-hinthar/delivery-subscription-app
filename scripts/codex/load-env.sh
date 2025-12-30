#!/usr/bin/env bash
set -euo pipefail

# Safe stubs ONLY if missing. Never put real secrets here.
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.stub}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-stub_service_role_key}"

export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_stub}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_stub}"
export GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY:-gmaps_stub}"
export CRON_SECRET="${CRON_SECRET:-stub_cron_secret}"

# Let code relax env checks ONLY for verify/build in ephemeral environments.
export CODEX_VERIFY="${CODEX_VERIFY:-1}"

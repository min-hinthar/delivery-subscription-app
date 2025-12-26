#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling corepack + pnpm"
corepack enable

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Basic sanity checks"
pnpm -v
node -v

echo "==> Optional: generate types if project already has supabase types tooling"
# If you later add a supabase types script, keep it non-fatal:
# pnpm supabase:types || true

echo "==> Done"

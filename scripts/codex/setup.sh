#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling corepack + pnpm"
corepack enable

if [ ! -f package.json ]; then
  echo "ERR: package.json not found at repo root."
  echo "Run the Bootstrap PR (Phase 0) first to scaffold Next.js into the repo."
  exit 1
fi

echo "==> Installing dependencies"
pnpm install --frozen-lockfile || pnpm install

echo "==> Done"
node -v
pnpm -v

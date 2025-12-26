#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling corepack + pnpm"
corepack enable

if [ ! -f package.json ]; then
  echo "==> No package.json found. Scaffolding Next.js app in repo root..."
  pnpm dlx create-next-app@latest . \
    --ts --tailwind --eslint --app --src-dir --use-pnpm --yes
fi

echo "==> Installing dependencies"
pnpm install --frozen-lockfile || pnpm install

echo "==> Sanity"
node -v
pnpm -v

echo "==> Done"

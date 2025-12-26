#!/usr/bin/env bash
set -euo pipefail

echo "==> Lint"
pnpm lint

echo "==> Typecheck"
pnpm typecheck

echo "==> Build"
pnpm build

echo "==> Done ✅"

#!/usr/bin/env bash
set -euo pipefail

# Load safe stub env for ephemeral environments (Codex/CI) if present.
if [[ -f "scripts/codex/load-env.sh" ]]; then
  # shellcheck disable=SC1091
  source scripts/codex/load-env.sh
fi

echo "==> Lint"
pnpm lint

echo "==> Typecheck"
pnpm typecheck

echo "==> Build"
pnpm build

echo "==> Done ✅"

#!/usr/bin/env bash
set -euo pipefail

echo "==> Verify: build gates"
bash scripts/codex/verify.sh

echo "==> Verify: route inventory sanity"
# Ensure key routes exist after refactor (adjust if you rename)
test -f "src/app/(app)/schedule/page.tsx" || (echo "Missing schedule page" && exit 1)
test -f "src/app/(app)/account/page.tsx" || (echo "Missing account page" && exit 1)
test -f "src/app/(admin)/layout.tsx" || (echo "Missing admin layout" && exit 1)

echo "==> Done ✅"

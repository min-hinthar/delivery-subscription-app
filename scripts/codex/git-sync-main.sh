#!/usr/bin/env bash
set -euo pipefail

echo "==> Git sync main (best effort)"
if git remote get-url origin >/dev/null 2>&1; then
  git fetch origin --quiet --no-tags main || true
  if git show-ref --verify --quiet refs/remotes/origin/main; then
    git checkout -B main origin/main
    echo "==> Checked out latest origin/main"
  else
    echo "WARN: origin/main not available; staying on current base."
  fi
else
  echo "WARN: No origin remote configured; staying on current base."
fi

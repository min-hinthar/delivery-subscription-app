#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling corepack + pnpm"
corepack enable

if [ ! -f package.json ]; then
  echo "==> No package.json found. Scaffolding Next.js app into a temp dir (repo is not empty)..."

  tmp="codex_next_scaffold"
  rm -rf "$tmp"
  mkdir -p "$tmp"

  pnpm dlx create-next-app@latest "$tmp" \
    --ts --tailwind --eslint --app --src-dir --use-pnpm --yes

  echo "==> Merging scaffold into repo root (preserving existing files)..."
  rsync -a "$tmp"/ ./ \
    --exclude README.md \
    --exclude AGENTS.md \
    --exclude scripts/ \
    --exclude codex/ \
    --exclude workflows/ \
    --exclude .github/

  # Preserve existing .gitignore if present; otherwise copy scaffold one
  if [ ! -f .gitignore ] && [ -f "$tmp/.gitignore" ]; then
    cp "$tmp/.gitignore" ./.gitignore
  fi

  rm -rf "$tmp"
fi

echo "==> Installing dependencies"
pnpm install --frozen-lockfile || pnpm install

echo "==> Sanity"
node -v
pnpm -v

echo "==> Done"

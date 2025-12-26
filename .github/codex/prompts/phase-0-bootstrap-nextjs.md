You are Codex in this repo. Follow AGENTS.md and docs/BLUEPRINT.md.

PHASE 0 GOAL: Scaffold Next.js into this non-empty repo WITHOUT committing any binary files.
This phase must only:
- scaffold the Next.js app into repo root
- preserve existing .github/workflows, scripts/, docs, README, AGENTS
- remove binary assets that block Codex PR creation (favicon.ico etc.)
- ensure pnpm lint/typecheck/build pass

Steps to perform:
1) Scaffold into a subdir at repo root named "codex_next_scaffold":
   pnpm dlx create-next-app@latest codex_next_scaffold --ts --tailwind --eslint --app --src-dir --use-pnpm --yes

2) Merge scaffold into repo root using rsync, preserving existing content:
   rsync -a codex_next_scaffold/ ./ \
     --exclude README.md \
     --exclude AGENTS.md \
     --exclude scripts/ \
     --exclude docs/ \
     --exclude .github/

3) Delete the scaffold folder:
   rm -rf codex_next_scaffold

4) Remove binary files that break Codex PR creation:
   rm -f src/app/favicon.ico
   rm -f public/favicon.ico

5) Replace favicon with text-only icon generator (no binaries):
   Create src/app/icon.tsx using next/og ImageResponse.

6) Install and verify:
   pnpm install
   pnpm lint
   pnpm typecheck
   pnpm build

7) Ensure .gitignore ignores common binaries:
   add at least: *.pyc, __pycache__/, .DS_Store

8) Prepare PR branch name: codex/phase-0-bootstrap-nextjs
Stop after Phase 0 is green.

You are Codex. Follow AGENTS.md and docs/CHANGE_POLICY.md.

PR GOAL (P0 Platform): Make verify/build and PR-start workflow reliable in ephemeral environments.

Must:
- Add scripts/codex/load-env.sh with safe stub env values and CODEX_VERIFY=1.
- Update scripts/codex/verify.sh to source load-env.sh before lint/typecheck/build.
- Add scripts/codex/git-sync-main.sh (best-effort sync to origin/main).
- Update src/lib/supabase/env.ts: strict in real env, tolerant during CODEX_VERIFY build checks.
- Add docs/CODEX_DEVEX.md explaining behavior.
- Update docs/BACKLOG.md item(s) status if needed.

Constraints:
- No secrets committed.
- No binary files.
- Run bash scripts/codex/verify.sh and ensure it passes.

Open PR: codex/platform-p0-devex

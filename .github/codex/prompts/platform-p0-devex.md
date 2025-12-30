You are Codex. Follow AGENTS.md.

PR GOAL (P0 Platform): Make verify/build and PR-start workflow reliable in ephemeral environments.

Must:
- Add scripts/codex/load-env.sh with safe stub env values and CODEX_VERIFY=1.
- Update scripts/codex/verify.sh to source load-env.sh before lint/typecheck/build.
- Add scripts/codex/git-sync-main.sh (best-effort sync to origin/main).
- Update src/lib/supabase/env.ts: strict in real env, tolerant during CODEX_VERIFY build checks.
- Ensure src/lib/supabase/client.ts does not call getSupabaseConfig() at module top-level (lazy singleton).
- Add docs/CODEX_DEVEX.md explaining behavior.

Constraints:
- No secrets committed.
- No binary files.
- Run bash scripts/codex/verify.sh and ensure it passes.

Open PR: codex/platform-p0-devex

# Codex DevEx — verify.sh env stubs

Codex/CI environments may not have real Supabase/Stripe env vars.
To keep `pnpm build` from failing, `scripts/codex/verify.sh` sources `scripts/codex/load-env.sh`
which provides safe stub values when missing and sets `CODEX_VERIFY=1`.

Strictness:
- In real environments (Vercel), `CODEX_VERIFY` is not set, so missing env vars still throw.
- During verify, stubs allow build to complete. Any runtime call that truly requires real env will still fail if exercised (expected).

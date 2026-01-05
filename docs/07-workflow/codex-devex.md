# Codex DevEx — verify.sh env stubs

Codex/CI environments may not have real Supabase/Stripe env vars.
To keep `pnpm build` from failing, `scripts/codex/verify.sh` sources `scripts/codex/load-env.sh`
which provides safe stub values when missing and sets `CODEX_VERIFY=1`.

Strictness:
- In real environments (Vercel), `CODEX_VERIFY` is not set, so missing env vars still throw.
- During verify, stubs allow build to complete. Any runtime call that truly requires real env will still fail if exercised (expected).

## Migration validation

`scripts/codex/verify.sh` also runs `scripts/codex/verify-migrations.sh` to validate SQL migrations.
The migration check only runs when `SUPABASE_MIGRATION_DB_URL` (or `MIGRATION_DATABASE_URL`) is set
and `psql` is available. This keeps production credentials safe while allowing CI/staging to apply
migrations against a clean, disposable database.

## Supabase SQL performance checks

`scripts/codex/verify.sh` runs `scripts/codex/verify-supabase-stats.sh` when
`SUPABASE_STATS_DB_URL` is available. The script enables `pg_stat_statements`, queries the most
expensive statements, and (when installed) runs the Supabase `splinter` report from
https://github.com/supabase/splinter. This is intended for staging/ops validation of query health
without requiring production credentials in the repo.

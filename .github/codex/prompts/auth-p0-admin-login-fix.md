You are Codex. Follow AGENTS.md, docs/QA_UX.md, and docs/CHANGE_POLICY.md.

PR GOAL (P0 Routing/Auth): Fix /admin/login redirect loop and improve login error messaging.

Must:
- Ensure /admin/login is NOT wrapped by admin-protected layout.
  Move admin login page out of (admin) gating using route groups so URL stays /admin/login.
- Keep admin pages protected by server-side admin gating in (admin)/layout.tsx.
- Improve login UX in both /login and /admin/login:
  For invalid credentials or non-existent account, show:
  "No active account found or credentials are incorrect. Please sign up."
  (avoid user enumeration).
- Add/Reuse a small helper for friendly auth error mapping.
- Run bash scripts/codex/verify.sh.

Constraints:
- No DB schema changes.
- No binary files.

Open PR: codex/auth-p0-admin-login-fix

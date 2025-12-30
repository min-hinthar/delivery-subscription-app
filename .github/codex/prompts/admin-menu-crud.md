You are Codex. Follow AGENTS.md and docs/CHANGE_POLICY.md and docs/SECURITY_QA.md.

PR GOAL: Admin Weekly Menu Management CRUD via service-role API and /admin/menus UI.

Must:
- Follow docs/ADMIN_OPERATIONS.md, docs/QA_UX.md, docs/SECURITY_QA.md, docs/BACKLOG.md 

- Create helpers: supabase service client + requireAdmin + response helpers + zod schemas
src/lib/supabase/service.ts
src/lib/auth/requireAdmin.ts
src/lib/api/response.ts
src/lib/admin/menuSchemas.ts

- Create admin APIs under /api/admin/*
src/app/api/admin/meals/route.ts
src/app/api/admin/weekly-menus/route.ts
src/app/api/admin/weekly-menus/update/route.ts
src/app/api/admin/weekly-menu-items/route.ts
src/app/api/admin/weekly-menu-items/update/route.ts
src/app/api/admin/weekly-menu-items/reorder/route.ts

- Add admin API routes:
  - GET /api/admin/meals (read catalog)
  - GET/POST /api/admin/weekly-menus
  - PATCH /api/admin/weekly-menus/update
  - GET/POST /api/admin/weekly-menu-items
  - PATCH/DELETE /api/admin/weekly-menu-items/update
  - POST /api/admin/weekly-menu-items/reorder

- Create /admin/menus UI (create/load week menu, add/edit/delete items, reorder, publish, add from catalog)
src/app/(admin)/admin/menus/page.tsx
- Add /admin/menus page UI with:
  - week selector (default: this week)
  - create menu button
  - edit title (save on blur)
  - publish toggle
  - list items with edit/delete
  - reorder Up/Down (persist)
  - add custom item dialog
  - add from catalog dialog (copy to weekly menu items)

- No binaries. No secrets.

- Update admin nav links
Update components/navigation/site-header.tsx ADMIN_LINKS to include:
{ label: "Menus", href: "/admin/menus", icon: ChefHat },

- Update BACKLOG/QA_UX/SECURITY_QA/ADMIN_OPERATIONS, CURRENT_APP_TREE.md after implementation
- Run bash scripts/codex/verify.sh


Open PR: codex/admin-menu-crud

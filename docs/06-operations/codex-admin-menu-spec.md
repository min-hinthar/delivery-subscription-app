# Admin Menu Spec (In-app CRUD)

## Data model
- `weekly_menus`: one row per week (`week_of` unique)
- `weekly_menu_items`: items displayed publicly for that week, ordered by `sort_order`

## Security model
- Public: read only *published* menus/items
- Admin: all writes via server endpoints under `/api/admin/*`
- Service role: used only in server routes after `requireAdmin` passes

## UI requirements
- Week selector (ISO date)
- Create/upsert menu if missing
- Edit title (save on blur)
- Publish toggle
- Item list with edit/delete and reorder
- Add-from-catalog and add-custom dialogs

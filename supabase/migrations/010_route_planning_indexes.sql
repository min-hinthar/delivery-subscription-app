create index if not exists delivery_routes_week_of_created_at_idx
  on public.delivery_routes(week_of, created_at);

create index if not exists delivery_routes_week_of_status_idx
  on public.delivery_routes(week_of, status);

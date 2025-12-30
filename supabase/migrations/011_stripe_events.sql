create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

create policy "stripe_events_admin_access"
on public.stripe_events
for all
using (public.is_admin())
with check (public.is_admin());

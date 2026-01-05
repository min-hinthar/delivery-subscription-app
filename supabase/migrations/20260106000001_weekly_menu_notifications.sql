-- Weekly menu notifications and stricter order update policy

alter table public.weekly_orders
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists reminder_sent_at timestamptz;

alter table public.weekly_menus
  add column if not exists notification_sent_at timestamptz;

drop policy if exists "weekly_orders_customer_update_pending" on public.weekly_orders;

create policy "weekly_orders_customer_update_pending"
  on public.weekly_orders for update
  using (
    customer_id = auth.uid()
    and status = 'pending'
    and driver_id is null
  );

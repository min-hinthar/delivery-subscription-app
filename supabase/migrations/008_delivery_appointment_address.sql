create or replace function public.set_delivery_appointment_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  primary_address_id uuid;
begin
  if new.address_id is null then
    select id into primary_address_id
    from public.addresses
    where user_id = new.user_id
      and is_primary = true
    limit 1;

    new.address_id := primary_address_id;
  end if;

  return new;
end;
$$;

drop trigger if exists delivery_appointments_set_address on public.delivery_appointments;
create trigger delivery_appointments_set_address
before insert or update on public.delivery_appointments
for each row execute function public.set_delivery_appointment_address();

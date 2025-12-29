create index if not exists delivery_appointments_week_of_status_idx
  on public.delivery_appointments(week_of, status);

create index if not exists delivery_appointments_week_of_window_idx
  on public.delivery_appointments(week_of, delivery_window_id);

create index if not exists delivery_appointments_address_id_idx
  on public.delivery_appointments(address_id);

create index if not exists delivery_stops_appointment_id_idx
  on public.delivery_stops(appointment_id);

create index if not exists addresses_user_primary_idx
  on public.addresses(user_id)
  where is_primary;

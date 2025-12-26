create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_full_name text;
begin
  computed_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );

  insert into public.profiles (id, email, full_name, phone, onboarding_completed)
  values (
    new.id,
    new.email,
    computed_full_name,
    new.raw_user_meta_data->>'phone',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        phone = coalesce(excluded.phone, public.profiles.phone),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

-- Check if a user is registered (exists in auth.users)
create or replace function public.user_exists_by_email(check_email text)
returns boolean as $$
  select exists (select 1 from auth.users where email = lower(trim(check_email)));
$$ language sql security definer;

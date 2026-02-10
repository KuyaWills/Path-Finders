-- OTP codes for custom email login (not Supabase Auth OTP)
create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  used_at timestamptz
);

create index if not exists idx_otp_codes_email on public.otp_codes(email);
create index if not exists idx_otp_codes_expires_at on public.otp_codes(expires_at);

-- RLS: Edge Functions use service role, so no policies needed for server-side access.
-- Block direct client access (anon can't read/write).
alter table public.otp_codes enable row level security;

create policy "Service role only"
  on public.otp_codes for all
  using (false)
  with check (false);

-- Ensure new users (from magic link after OTP verify) get a profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_premium)
  values (new.id, false)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

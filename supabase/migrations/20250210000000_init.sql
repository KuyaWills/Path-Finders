-- Profiles: one per user, stores premium status
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Daily content: one row per day (or reuse by slug)
create table if not exists public.daily_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table public.daily_content enable row level security;

create policy "Anyone can read daily content"
  on public.daily_content for select
  using (true);

-- Library items (guides, tips, exercises)
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null check (kind in ('guide', 'tip', 'exercise', 'what_to_do')),
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.library_items enable row level security;

create policy "Anyone can read library items"
  on public.library_items for select
  using (true);

-- Seed daily content
insert into public.daily_content (slug, title, body) values
  ('today-tip', 'Today''s tip', 'Start your session by writing one small test before the code. It focuses your mind and improves design.')
on conflict (slug) do nothing;

-- Seed library (run once; ignore if already seeded)
insert into public.library_items (title, description, kind, sort_order)
select * from (values
  ('What to do when you''re stuck', 'A short guide to debugging and asking for help.', 'what_to_do', 1),
  ('5-minute focus drill', 'A quick exercise to get into flow.', 'exercise', 2),
  ('Code review checklist', 'Things to check before submitting PRs.', 'guide', 3)
) v(title, description, kind, sort_order)
where not exists (select 1 from public.library_items limit 1);

-- Plateful prototype: database setup for Supabase (SEG 4505, Group 10)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- 1. Profiles: one row per user (name, daily goal, language, training consent)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  daily_goal  integer not null default 2200 check (daily_goal between 1000 and 5000),
  lang        text not null default 'en' check (lang in ('en','fr')),
  consent     boolean not null default false,
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2. Meals: every logged meal, with its macros and the per-ingredient detail
create table if not exists public.meals (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  eaten_at      timestamptz not null default now(),
  slot          smallint not null check (slot between 0 and 3),   -- 0 breakfast, 1 lunch, 2 snack, 3 dinner
  dish          jsonb not null,                                   -- "name" or ["English","Français"]
  kcal          numeric(7,1) not null check (kcal >= 0),
  protein_g     numeric(6,1) not null default 0,
  carbs_g       numeric(6,1) not null default 0,
  fat_g         numeric(6,1) not null default 0,
  grams         numeric(7,1) not null default 0,
  items         jsonb not null default '[]',                      -- ingredients: name, grams, kcal, confidence
  thumb         text,                                             -- small JPEG thumbnail (data URL)
  sample_index  smallint,                                         -- which built-in sample meal, if any
  is_demo       boolean not null default false,                   -- true = generated sample history
  created_at    timestamptz not null default now()
);
create index if not exists meals_user_time on public.meals (user_id, eaten_at desc);

-- 3. Corrections: user edits, the labelled data for incremental training (FR5)
create table if not exists public.corrections (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dish        jsonb,
  before      jsonb not null,
  after       jsonb not null,
  consent     boolean not null,
  created_at  timestamptz not null default now()
);

-- 4. Row-level security: each user can only see and change their own rows
alter table public.profiles    enable row level security;
alter table public.meals       enable row level security;
alter table public.corrections enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own meals" on public.meals;
create policy "own meals" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own corrections" on public.corrections;
create policy "own corrections" on public.corrections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Create the profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, lang)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name', ''),
          coalesce(nullif(new.raw_user_meta_data->>'lang', ''), 'en'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Let signed-in users use the tables through the API
grant select, insert, update, delete on public.profiles, public.meals, public.corrections to authenticated;

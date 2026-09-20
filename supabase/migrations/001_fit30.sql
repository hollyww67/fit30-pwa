-- Fit30 MVP schema for Supabase
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  height_cm numeric(5,2) not null default 165,
  start_weight_kg numeric(5,2) not null default 85,
  target_weight_kg numeric(5,2) not null default 62.5,
  calories_target integer not null default 1700,
  protein_target_g integer not null default 120,
  water_target_l numeric(4,2) not null default 2.2,
  steps_target integer not null default 8500,
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2),
  steps integer,
  water_l numeric(4,2),
  sleep_hours numeric(4,2),
  calories integer,
  protein_g integer,
  workout_status text not null default 'not_started' check (workout_status in ('not_started','partial','done','skipped')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.meal_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal_key text not null check (meal_key in ('breakfast','lunch','snack','dinner')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, date, meal_key)
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  waist_cm numeric(5,2),
  abdomen_cm numeric(5,2),
  hips_cm numeric(5,2),
  chest_cm numeric(5,2),
  thigh_cm numeric(5,2),
  arm_cm numeric(5,2),
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table if not exists public.program_day_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_day integer not null check (program_day between 1 and 30),
  completed boolean not null default false,
  completed_at timestamptz,
  unique(user_id, program_day)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_day integer check (program_day between 1 and 30),
  workout_code text not null,
  status text not null default 'started' check (status in ('started','completed','abandoned')),
  duration_min integer,
  rpe numeric(3,1),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null,
  set_number integer not null,
  weight_kg numeric(6,2),
  reps integer,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists daily_checkins_set_updated_at on public.daily_checkins;
create trigger daily_checkins_set_updated_at before update on public.daily_checkins
for each row execute function public.set_updated_at();

-- auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.meal_checks enable row level security;
alter table public.body_measurements enable row level security;
alter table public.program_day_status enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

create policy "profiles_owner_all" on public.profiles for all to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "daily_checkins_owner_all" on public.daily_checkins for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meal_checks_owner_all" on public.meal_checks for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "body_measurements_owner_all" on public.body_measurements for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "program_day_status_owner_all" on public.program_day_status for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workout_sessions_owner_all" on public.workout_sessions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workout_sets_owner_all" on public.workout_sets for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists daily_checkins_user_date_idx on public.daily_checkins(user_id, date);
create index if not exists meal_checks_user_date_idx on public.meal_checks(user_id, date);
create index if not exists body_measurements_user_date_idx on public.body_measurements(user_id, date);
create index if not exists workout_sessions_user_idx on public.workout_sessions(user_id, started_at desc);

-- Apply once as a migration. A failed validation or DDL statement rolls back
-- the lock, all constraints, and privilege changes together.
begin;

-- Gate checked against production on 2026-09-21: both workout tables had 0 rows.
-- Block concurrent writes between validation and constraint creation.
lock table
  public.workout_sessions,
  public.workout_sets
in share row exclusive mode;

do $$
begin
  if exists (
    select 1 from public.workout_sets s
    left join public.workout_sessions w on w.id = s.session_id
    where w.id is null
  ) then
    raise exception 'FIT30 migration blocked: orphan workout set';
  end if;
  if exists (
    select 1 from public.workout_sets s
    join public.workout_sessions w on w.id = s.session_id
    where s.user_id is distinct from w.user_id
  ) then
    raise exception 'FIT30 migration blocked: workout set owner differs from session owner';
  end if;
  if exists (
    select 1 from public.workout_sets
    group by session_id, exercise_key, set_number
    having count(*) > 1
  ) then
    raise exception 'FIT30 migration blocked: duplicate workout set key';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workout_sets' and column_name = 'rpe'
  ) or exists (
    select 1 from pg_constraint
    where conrelid in ('public.workout_sessions'::regclass, 'public.workout_sets'::regclass)
      and conname in (
        'workout_sessions_id_user_unique',
        'workout_sets_session_owner_fk',
        'workout_sets_rpe_check',
        'workout_sets_session_exercise_set_unique'
      )
  ) or to_regclass('public.workout_sets_user_exercise_created_idx') is not null then
    raise exception 'FIT30 migration blocked: schema is already partially or fully migrated; inspect before rerunning';
  end if;
end;
$$;

-- A set must belong to the same user as its parent session.
alter table public.workout_sessions
  add constraint workout_sessions_id_user_unique unique (id, user_id);

alter table public.workout_sets
  add constraint workout_sets_session_owner_fk
  foreign key (session_id, user_id)
  references public.workout_sessions (id, user_id)
  on delete cascade;

alter table public.workout_sets
  add column rpe numeric(3,1);

-- PostgreSQL CHECK accepts NULL, so older sets and omitted RPE stay valid.
alter table public.workout_sets
  add constraint workout_sets_rpe_check check (rpe between 1 and 10);

alter table public.workout_sets
  add constraint workout_sets_session_exercise_set_unique
  unique (session_id, exercise_key, set_number);

create index workout_sets_user_exercise_created_idx
  on public.workout_sets (user_id, exercise_key, created_at desc);

-- RLS does not guard TRUNCATE. Browser roles do not need schema privileges.
revoke all privileges on table
  public.profiles, public.daily_checkins, public.meal_checks,
  public.body_measurements, public.program_day_status,
  public.workout_sessions, public.workout_sets
from anon;

revoke truncate, trigger, references on table
  public.profiles, public.daily_checkins, public.meal_checks,
  public.body_measurements, public.program_day_status,
  public.workout_sessions, public.workout_sets
from authenticated;

-- The signup trigger is invoked by Postgres, not through the public Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;

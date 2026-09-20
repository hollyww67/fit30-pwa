-- FIT30 production gate. Read-only; run immediately before the migration.
-- Stop if orphan_sets, ownership_conflicts, duplicate_set_keys, or required_set_nulls
-- are nonzero. Review any partially present migration objects before proceeding.
select
  now() as checked_at,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.workout_sessions) as workout_sessions,
  (select count(*) from public.workout_sets) as workout_sets,
  (select count(*) from public.workout_sets s left join public.workout_sessions w on w.id = s.session_id where w.id is null) as orphan_sets,
  (select count(*) from public.workout_sets s join public.workout_sessions w on w.id = s.session_id where s.user_id is distinct from w.user_id) as ownership_conflicts,
  (select count(*) from (select 1 from public.workout_sets group by session_id, exercise_key, set_number having count(*) > 1) d) as duplicate_set_keys,
  (select count(*) from public.workout_sessions w left join auth.users u on u.id = w.user_id where u.id is null) as sessions_without_auth_user,
  (select count(*) from public.workout_sessions w left join public.profiles p on p.id = w.user_id where p.id is null) as sessions_without_profile,
  (select count(*) from public.workout_sets where session_id is null or user_id is null or exercise_key is null or set_number is null) as required_set_nulls,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'workout_sets' and column_name = 'rpe') as has_set_rpe,
  exists (select 1 from pg_constraint where conrelid = 'public.workout_sets'::regclass
    and conname = 'workout_sets_session_owner_fk') as has_owner_fk,
  exists (select 1 from pg_constraint where conrelid = 'public.workout_sets'::regclass
    and conname = 'workout_sets_session_exercise_set_unique') as has_unique_set_key;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  p.polname, p.polcmd, p.polroles::regrole[] as roles,
  pg_get_expr(p.polqual, p.polrelid) as using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expr
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('profiles', 'daily_checkins', 'meal_checks',
    'body_measurements', 'program_day_status', 'workout_sessions', 'workout_sets')
order by c.relname, p.polname;

select table_name, column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('workout_sessions', 'workout_sets')
order by table_name, ordinal_position;

-- Inspect any existing index with the proposed history prefix.
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'workout_sets'
order by indexname;

select role_name, table_name,
  has_table_privilege(role_name, 'public.' || table_name, 'SELECT') as can_select,
  has_table_privilege(role_name, 'public.' || table_name, 'INSERT') as can_insert,
  has_table_privilege(role_name, 'public.' || table_name, 'UPDATE') as can_update,
  has_table_privilege(role_name, 'public.' || table_name, 'DELETE') as can_delete,
  has_table_privilege(role_name, 'public.' || table_name, 'TRUNCATE') as can_truncate,
  has_table_privilege(role_name, 'public.' || table_name, 'TRIGGER') as can_trigger,
  has_table_privilege(role_name, 'public.' || table_name, 'REFERENCES') as can_reference
from (values ('anon'), ('authenticated')) roles(role_name)
cross join (values ('profiles'), ('daily_checkins'), ('meal_checks'),
  ('body_measurements'), ('program_day_status'), ('workout_sessions'),
  ('workout_sets')) tables(table_name)
order by role_name, table_name;

select
  pg_get_userbyid(p.proowner) as function_owner,
  p.prosecdef as security_definer,
  p.proconfig as function_config,
  p.proacl as function_acl,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
where p.oid = 'public.handle_new_user()'::regprocedure;

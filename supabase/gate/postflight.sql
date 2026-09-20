-- FIT30 production gate. Read-only; run after the migration.
-- Every required_* flag should be true; every *_can_* unsafe flag should be false.
with constraints as (
  select c.conname, c.contype, c.convalidated, c.confrelid, c.confdeltype,
    (select array_agg(a.attname::text order by u.ord)
     from unnest(c.conkey) with ordinality u(attnum, ord)
     join pg_attribute a on a.attrelid = c.conrelid and a.attnum = u.attnum) as columns,
    (select array_agg(a.attname::text order by u.ord)
     from unnest(c.confkey) with ordinality u(attnum, ord)
     join pg_attribute a on a.attrelid = c.confrelid and a.attnum = u.attnum) as referenced_columns
  from pg_constraint c
  where c.conrelid in ('public.workout_sessions'::regclass, 'public.workout_sets'::regclass)
)
select
  exists (select 1 from pg_attribute a
    where a.attrelid = 'public.workout_sets'::regclass and a.attname = 'rpe'
      and not a.attisdropped and not a.attnotnull
      and format_type(a.atttypid, a.atttypmod) = 'numeric(3,1)') as required_nullable_rpe_type,
  exists (select 1 from constraints where conname = 'workout_sets_rpe_check'
    and contype = 'c' and convalidated) as required_rpe_check,
  exists (select 1 from constraints where conname = 'workout_sessions_id_user_unique'
    and contype = 'u' and convalidated and columns = array['id', 'user_id']) as required_session_owner_key,
  exists (select 1 from constraints where conname = 'workout_sets_session_owner_fk'
    and contype = 'f' and convalidated and confdeltype = 'c'
    and confrelid = 'public.workout_sessions'::regclass
    and columns = array['session_id', 'user_id']
    and referenced_columns = array['id', 'user_id']) as required_composite_owner_fk,
  exists (select 1 from constraints where conname = 'workout_sets_session_exercise_set_unique'
    and contype = 'u' and convalidated
    and columns = array['session_id', 'exercise_key', 'set_number']) as required_unique_set_key,
  exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'workout_sets'
    and indexname = 'workout_sets_user_exercise_created_idx'
    and indexdef like '%(user_id, exercise_key, created_at DESC)%') as required_history_index;

-- Review the actual CHECK expression and index definitions as well.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.workout_sets'::regclass
  and conname in ('workout_sets_rpe_check', 'workout_sets_session_owner_fk',
    'workout_sets_session_exercise_set_unique')
order by conname;

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
  p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as function_owner,
  p.proconfig as function_config,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
where p.oid = 'public.handle_new_user()'::regprocedure;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  p.polname, p.polcmd,
  pg_get_expr(p.polqual, p.polrelid) as using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expr
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('profiles', 'daily_checkins', 'meal_checks',
    'body_measurements', 'program_day_status', 'workout_sessions', 'workout_sets')
order by c.relname, p.polname;

select
  (select count(*) from public.workout_sets s left join public.workout_sessions w
    on w.id = s.session_id where w.id is null) as orphan_sets,
  (select count(*) from public.workout_sets s join public.workout_sessions w
    on w.id = s.session_id where s.user_id is distinct from w.user_id) as ownership_conflicts,
  (select count(*) from (select 1 from public.workout_sets
    group by session_id, exercise_key, set_number having count(*) > 1) d) as duplicate_set_keys;

-- One-shot production authorization test. Do not commit test data.
-- Auth users and their trigger-created profiles must already exist.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81513fc5-0e48-41a5-b395-fca518cc8c40","role":"authenticated"}', true);

do $$
declare
  a constant uuid := '81513fc5-0e48-41a5-b395-fca518cc8c40';
  b constant uuid := '772915d9-6a72-4980-b585-200fb123c552';
  sa uuid;
  sb uuid;
  ca uuid;
  cb uuid;
  ma uuid;
  mb uuid;
  pa uuid;
  pb uuid;
  seta uuid;
  setb uuid;
  n integer;
  rejected boolean;
begin
  if current_user <> 'authenticated' or auth.uid() is distinct from a then
    raise exception 'A impersonation failed: role %, uid %', current_user, auth.uid();
  end if;
  if (select count(*) from public.profiles where id = a) <> 1 then raise exception 'A own profile SELECT failed'; end if;
  update public.profiles set display_name = 'FIT30 RLS A temporary' where id = a;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'A own profile UPDATE failed'; end if;

  insert into public.daily_checkins(user_id,date,weight_kg,steps) values(a,current_date,80,8000) returning id into ca;
  insert into public.body_measurements(user_id,date,waist_cm) values(a,current_date,90) returning id into ma;
  insert into public.program_day_status(user_id,program_day,completed) values(a,1,true) returning id into pa;
  insert into public.workout_sessions(user_id,program_day,workout_code) values(a,1,'rls_test_a') returning id into sa;
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps,rpe,completed)
    values(sa,a,'goblet_squat',1,8,12,7.5,true) returning id into seta;
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps,rpe,completed)
    values(sa,a,'goblet_squat',2,8,12,null,true);
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps,rpe,completed)
    values(sa,a,'goblet_squat',3,8,12,10,true);
  if (select count(*) from public.daily_checkins where id=ca and user_id=a and steps=8000) <> 1
    or (select count(*) from public.body_measurements where id=ma and user_id=a) <> 1
    or (select count(*) from public.program_day_status where id=pa and user_id=a) <> 1
    or (select count(*) from public.workout_sessions where id=sa and user_id=a) <> 1
    or (select count(*) from public.workout_sets where session_id=sa and user_id=a) <> 3
  then raise exception 'A own INSERT/SELECT failed'; end if;
  update public.daily_checkins set steps=8100 where id=ca;
  get diagnostics n=row_count; if n<>1 then raise exception 'A checkin UPDATE failed'; end if;
  update public.body_measurements set waist_cm=89 where id=ma;
  get diagnostics n=row_count; if n<>1 then raise exception 'A measurement UPDATE failed'; end if;
  update public.workout_sets set reps=13 where id=seta;
  get diagnostics n=row_count; if n<>1 then raise exception 'A set UPDATE failed'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub',b::text,'role','authenticated')::text, true);
  if current_user <> 'authenticated' or auth.uid() is distinct from b then
    raise exception 'B impersonation failed: role %, uid %', current_user, auth.uid();
  end if;
  if (select count(*) from public.profiles where id=b)<>1 then raise exception 'B own profile SELECT failed'; end if;
  update public.profiles set display_name='FIT30 RLS B temporary' where id=b;
  get diagnostics n=row_count; if n<>1 then raise exception 'B profile UPDATE failed'; end if;
  insert into public.daily_checkins(user_id,date,weight_kg,steps) values(b,current_date,70,7000) returning id into cb;
  insert into public.body_measurements(user_id,date,waist_cm) values(b,current_date,80) returning id into mb;
  insert into public.program_day_status(user_id,program_day,completed) values(b,1,true) returning id into pb;
  insert into public.workout_sessions(user_id,program_day,workout_code) values(b,1,'rls_test_b') returning id into sb;
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps,rpe,completed)
    values(sb,b,'goblet_squat',1,6,10,7.5,true) returning id into setb;
  if (select count(*) from public.daily_checkins where id=cb and user_id=b)<>1
    or (select count(*) from public.body_measurements where id=mb and user_id=b)<>1
    or (select count(*) from public.program_day_status where id=pb and user_id=b)<>1
    or (select count(*) from public.workout_sessions where id=sb and user_id=b)<>1
    or (select count(*) from public.workout_sets where id=setb and user_id=b)<>1
  then raise exception 'B own INSERT/SELECT failed'; end if;
  update public.daily_checkins set steps=7100 where id=cb;
  get diagnostics n=row_count; if n<>1 then raise exception 'B checkin UPDATE failed'; end if;
  update public.body_measurements set waist_cm=79 where id=mb;
  get diagnostics n=row_count; if n<>1 then raise exception 'B measurement UPDATE failed'; end if;
  update public.workout_sets set reps=11 where id=setb;
  get diagnostics n=row_count; if n<>1 then raise exception 'B set UPDATE failed'; end if;

  if (select count(*) from public.profiles where id=a)<>0
    or (select count(*) from public.daily_checkins where id=ca)<>0
    or (select count(*) from public.body_measurements where id=ma)<>0
    or (select count(*) from public.program_day_status where id=pa)<>0
    or (select count(*) from public.workout_sessions where id=sa)<>0
    or (select count(*) from public.workout_sets where session_id=sa)<>0
  then raise exception 'Cross-user SELECT disclosed A data'; end if;

  update public.profiles set display_name='ATTACK' where id=a;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user profile UPDATE'; end if;
  update public.daily_checkins set steps=999 where id=ca;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user checkin UPDATE'; end if;
  update public.body_measurements set waist_cm=999 where id=ma;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user measurement UPDATE'; end if;
  update public.program_day_status set completed=false where id=pa;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user program UPDATE'; end if;
  update public.workout_sessions set status='completed' where id=sa;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user session UPDATE'; end if;
  update public.workout_sets set reps=999 where id=seta;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user set UPDATE'; end if;

  delete from public.workout_sets where id=seta;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user set DELETE'; end if;
  delete from public.workout_sessions where id=sa;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user session DELETE'; end if;
  delete from public.program_day_status where id=pa;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user program DELETE'; end if;
  delete from public.body_measurements where id=ma;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user measurement DELETE'; end if;
  delete from public.daily_checkins where id=ca;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user checkin DELETE'; end if;
  delete from public.profiles where id=a;
  get diagnostics n=row_count; if n<>0 then raise exception 'Cross-user profile DELETE'; end if;

  rejected:=false;
  begin
    insert into public.workout_sets(session_id,user_id,exercise_key,set_number) values(sa,b,'attack_test',1);
  exception when foreign_key_violation then rejected:=true; end;
  if not rejected then raise exception 'Composite ownership attack was not blocked by FK'; end if;

  rejected:=false;
  begin insert into public.daily_checkins(user_id,date) values(a,current_date+1);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'Checkin user_id spoofing not blocked by RLS'; end if;
  rejected:=false;
  begin insert into public.body_measurements(user_id,date) values(a,current_date+1);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'Measurement user_id spoofing not blocked by RLS'; end if;
  rejected:=false;
  begin insert into public.workout_sessions(user_id,workout_code) values(a,'spoof_test');
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'Session user_id spoofing not blocked by RLS'; end if;
  rejected:=false;
  begin insert into public.workout_sets(session_id,user_id,exercise_key,set_number) values(sb,a,'spoof_test',1);
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'Set user_id spoofing not blocked by RLS'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub',a::text,'role','authenticated')::text, true);
  if auth.uid() is distinct from a then raise exception 'A re-impersonation failed'; end if;
  if (select count(*) from public.daily_checkins where id=ca and steps=8100)<>1
    or (select count(*) from public.body_measurements where id=ma and waist_cm=89)<>1
    or (select count(*) from public.workout_sessions where id=sa and status='started')<>1
    or (select count(*) from public.workout_sets where id=seta and reps=13)<>1
  then raise exception 'A data changed after B attack'; end if;

  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps)
    values(sa,a,'duplicate_test',1,8,12);
  rejected:=false;
  begin
    insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps)
      values(sa,a,'duplicate_test',1,9,10);
  exception when unique_violation then rejected:=true; end;
  if not rejected then raise exception 'Duplicate set INSERT not blocked'; end if;
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,weight_kg,reps)
    values(sa,a,'duplicate_test',1,9,10)
    on conflict(session_id,exercise_key,set_number) do update
      set weight_kg=excluded.weight_kg,reps=excluded.reps;
  if (select count(*) from public.workout_sets where session_id=sa and exercise_key='duplicate_test' and set_number=1)<>1
    or (select count(*) from public.workout_sets where session_id=sa and exercise_key='duplicate_test' and set_number=1 and weight_kg=9 and reps=10)<>1
  then raise exception 'Workout set UPSERT failed'; end if;

  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',1,null);
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',2,1);
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',3,7.5);
  insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',4,10);
  if (select count(*) from public.workout_sets where session_id=sa and exercise_key='rpe_test' and rpe is null)<>1
    or (select count(*) from public.workout_sets where session_id=sa and exercise_key='rpe_test' and rpe=7.5)<>1
  then raise exception 'Valid RPE values failed'; end if;
  rejected:=false;
  begin insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',5,0);
  exception when check_violation then rejected:=true; end;
  if not rejected then raise exception 'RPE 0 not blocked'; end if;
  rejected:=false;
  begin insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',6,10.1);
  exception when check_violation then rejected:=true; end;
  if not rejected then raise exception 'RPE 10.1 not blocked'; end if;
  rejected:=false;
  begin insert into public.workout_sets(session_id,user_id,exercise_key,set_number,rpe) values(sa,a,'rpe_test',7,11);
  exception when check_violation then rejected:=true; end;
  if not rejected then raise exception 'RPE 11 not blocked'; end if;
end $$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare rejected boolean:=false;
begin
  if current_user <> 'anon' then raise exception 'Anon role impersonation failed'; end if;
  begin perform count(*) from public.profiles;
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'Anon SELECT on profiles was allowed'; end if;
  rejected:=false;
  begin perform count(*) from public.workout_sets;
  exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'Anon SELECT on workout_sets was allowed'; end if;
end $$;
rollback;
select 'FIT30 PRACTICAL RLS GATE PASS; TRANSACTION ROLLED BACK' as result;

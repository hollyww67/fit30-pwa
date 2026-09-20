create index if not exists workout_sets_session_user_idx
  on public.workout_sets (session_id, user_id);

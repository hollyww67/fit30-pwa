# FIT30 Database Migration Safety Report

Checked on 2026-09-21 against Supabase project `vvmnsrirxwspkotyrdjm` (`fit30`).
The project's ref matches the local `NEXT_PUBLIC_SUPABASE_URL`.

Applied through the Supabase migration mechanism on 2026-09-21. Supabase
recorded version `20260920221728`; the local migration file was renamed to
that version so future migration runs do not replay it.

## Before migration

| Check | Observed |
| --- | ---: |
| auth users | 0 |
| profiles | 0 |
| workout_sessions | 0 |
| workout_sets | 0 |
| orphan sets | 0 |
| owner mismatches | 0 |
| duplicate (session_id, exercise_key, set_number) keys | 0 |
| sessions without auth user/profile | 0 / 0 |
| required-column NULL conflicts | 0 |

All seven public tables have RLS enabled. Each has one `FOR ALL TO authenticated`
owner policy: `USING auth.uid() = id` for profiles and `USING auth.uid() = user_id`
for the other six; `WITH CHECK` has the same condition. This covers SELECT,
INSERT, UPDATE, and DELETE. There are no additional permissive policies.
The policies prevent reading or changing another user's rows, but before the
migration they do not prove that a set's `user_id` matches its session owner.

Direct table grants include `TRUNCATE` for `anon` and `authenticated`.
RLS does not protect TRUNCATE. Supabase's security advisor also reports that
`public.handle_new_user()`, a SECURITY DEFINER trigger function, has EXECUTE
grants for both roles. The migration revokes these privileges.

The project currently has no Storage buckets or objects. No Storage changes
are included.

## Migration review

File: `../migrations/20260920221728_workout_set_ownership.sql`.

It begins an explicit transaction, locks both workout tables during a final preflight, aborts if a set is
orphaned, owned by someone other than its session owner, or has a duplicate
natural key; adds a nullable RPE column; adds a composite owner foreign key
and unique keys; adds one history index; revokes unsafe table/function grants.
It does not delete or rewrite any existing rows, add a NOT NULL requirement,
or change any RLS policy. The nullable `rpe numeric(3,1)` has a named
`CHECK (rpe between 1 and 10)`; PostgreSQL permits NULL in this check.
The original simple `session_id → id` FK remains. The composite FK makes it
redundant for ownership, but retaining it avoids dropping an existing
constraint during this security migration. The unique keys and foreign key would fail on
incompatible rows, so the preflight deliberately stops before DDL. A repeated
or partially applied run raises a clear exception and rolls back. The history
index was not present or duplicated in the inspected production schema.

The new composite foreign key prevents User A from inserting a set under User
B's session even if A supplies A's own `user_id`. Existing RLS prevents A
from reading, updating, or deleting B's rows. This is a logical policy review;
the live two-user test remains outstanding because this project has zero auth
users.

## Current gate status

**Applied: YES. Postflight: PASS.** The connected production database has
`workout_sets.rpe numeric(3,1)`, the RPE CHECK, the composite owner FK,
unique set key, and history index. `anon` has no direct privileges on the
seven private tables. `authenticated` has CRUD and no TRUNCATE, TRIGGER, or
REFERENCES. Direct EXECUTE on `handle_new_user()` is denied to both roles;
the `on_auth_user_created` trigger remains. Security Advisor returned no
findings. A follow-up migration added the composite FK covering index,
`workout_sets_session_user_idx`, and Supabase recorded it as version
`20260920223234`. Performance Advisor no longer reports the unindexed FK;
it reports INFO for five unused indexes on currently empty tables. Keep
those indexes until real workload data can inform their value.

## Execution order and expected results

1. **Preflight:** run `preflight.sql` in project `vvmnsrirxwspkotyrdjm`.
   Conflict and required-NULL counts must be zero; `has_set_rpe`,
   `has_owner_fk`, and `has_unique_set_key` should all be false for this
   one-shot migration. Inspect grants, function ACL, RLS, and existing indexes.
   If any migration object is already present, stop and reconcile the schema.
2. **Migration:** run the entire
   `../migrations/20260920221728_workout_set_ownership.sql` in one execution.
   It contains `BEGIN` and `COMMIT`; any raised exception or DDL error
   aborts the whole transaction. No row is deleted. Do not run fragments.
3. **Postflight:** run `postflight.sql`. Every `required_*` flag must be
   true. The RPE CHECK definition must constrain 1–10 while allowing NULL.
   Both `*_can_execute` fields must be false. All `anon` table privileges
   must be false; `authenticated` must have SELECT/INSERT/UPDATE/DELETE and
   no TRUNCATE/TRIGGER/REFERENCES. Seven tables must retain owner RLS
   policies; orphan, mismatch, and duplicate counts must remain zero.
4. **Advisors:** run Supabase security advisors. The two warnings for
   `public.handle_new_user()` must disappear. It remains SECURITY DEFINER,
   owned by `postgres`, with empty `search_path`, used by
   `on_auth_user_created` on `auth.users`. The function inserts only
   `NEW.id` and display text; it does not interpolate SQL.
5. **Test user A:** create a genuine Auth account and verify its profile
   trigger. As A, create a check-in, measurement, session, and three sets with
   weights, reps, and RPE; read them back. Repeat a set key with UPSERT and
   verify one row remains.
6. **Test user B:** create a separate genuine Auth account; verify its own
   profile and normal writes.
7. **Cross-user test:** using B's JWT through the Data API, SELECT/UPDATE/
   DELETE A's rows must affect zero rows, and inserting a set with B's
   `user_id` under A's session must fail the composite FK. SQL Editor runs
   with administrative privileges and cannot substitute for this test.
8. **Application Auth test:** exercise signup, email confirmation, callback,
   login, refresh, private-route redirect, logout, and password reset against
   the candidate app; ensure `?next=https://evil.example` cannot redirect
   externally. Recheck `https://vieww.ru` after deployment.
9. **Lint:** `npm run lint` must pass.
10. **Build:** `npm run build` must pass.
11. **Commit:** only after the Database and Auth gate passes, stage the
    migration, gate files, and code; make one reviewed commit. SQL Editor
    execution does not populate Supabase migration history, so reconcile
    history before future CLI deployments; do not guess or insert history
    rows by hand. The original base file `001_fit30.sql` is not represented
    in Supabase migration history and must be reconciled separately before
    running `supabase db push` from this repository.
12. **Deploy:** deploy only after the gate and commit; run an unauthenticated
    and authenticated smoke test on `https://vieww.ru`.

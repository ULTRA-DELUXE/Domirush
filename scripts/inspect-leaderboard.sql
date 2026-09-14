-- Read-only catalog check for leaderboard_runs. Safe to re-run. Requires psql.

\echo '=== table ==='
select c.relname,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'leaderboard_runs';

\echo '=== columns ==='
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'leaderboard_runs'
order by ordinal_position;

\echo '=== checks ==='
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.leaderboard_runs'::regclass
  and contype in ('c', 'p')
order by conname;

\echo '=== indexes ==='
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'leaderboard_runs'
order by indexname;

\echo '=== trigger ==='
select tgname, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
where t.tgrelid = 'public.leaderboard_runs'::regclass
  and not t.tgisinternal
order by tgname;

\echo '=== function ==='
select p.proname,
       p.prosecdef as security_definer,
       p.proconfig as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'trim_leaderboard_runs';

\echo '=== policies ==='
select policyname, permissive, roles, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'leaderboard_runs'
order by policyname;

\echo '=== grants ==='
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'leaderboard_runs'
order by grantee, privilege_type;

\echo '=== row counts by mode/scope ==='
select mode_id, coalesce(scope, '<null>') as scope, count(*) as rows
from leaderboard_runs
group by 1, 2
order by 1, 2;

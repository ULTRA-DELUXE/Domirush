-- Canonical leaderboard schema for Domirush (polish plan §5).
-- Hosted project is ap-northeast-1; session pooler is IPv4-reachable:
--   postgresql://postgres.<project-ref>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
-- Apply with: node --env-file=.env.local scripts/apply-leaderboard-schema.mjs
-- Idempotent. Personal bests are NOT stored here — localStorage only (§5.1).

create extension if not exists pgcrypto;

create table if not exists leaderboard_runs (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 20),
  mode_id text not null check (mode_id in ('streak-5', 'streak-10', 'streak-15')),
  scope text,
  total_time_ms integer not null check (total_time_ms > 0),
  rank text not null check (rank in ('the-flash', 'late-for-work', 'soccer-mom', 'slowpoke')),
  created_at timestamptz not null default now()
);

alter table leaderboard_runs
  drop constraint if exists leaderboard_runs_scope_nonempty;
alter table leaderboard_runs
  add constraint leaderboard_runs_scope_nonempty
  check (scope is null or length(btrim(scope)) > 0);

alter table leaderboard_runs
  drop constraint if exists leaderboard_runs_player_name_trimmed;
alter table leaderboard_runs
  add constraint leaderboard_runs_player_name_trimmed
  check (player_name = btrim(player_name));

create index if not exists idx_leaderboard_runs_lookup
  on leaderboard_runs (mode_id, coalesce(scope, ''), total_time_ms);

-- Streak modes always write scope = null; this is the hot path for GET.
create index if not exists idx_leaderboard_runs_streak
  on leaderboard_runs (mode_id, total_time_ms, created_at)
  where scope is null;

comment on table leaderboard_runs is
  'Global top-7 bragging-rights board per (mode_id, scope). Personal bests stay in the browser.';
comment on column leaderboard_runs.scope is
  'Null for streak modes; reserved for future daily/endless boards.';

-- Trim outside the top 7 immediately after each insert/update, per (mode_id, scope).
-- SECURITY DEFINER so the delete still runs if a restricted role ever inserts.
-- Tie-break: faster first, then older created_at, then id — deterministic cap.
create or replace function trim_leaderboard_runs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from leaderboard_runs lr
  where lr.mode_id = new.mode_id
    and coalesce(lr.scope, '') = coalesce(new.scope, '')
    and lr.id not in (
      select id from leaderboard_runs
      where mode_id = new.mode_id
        and coalesce(scope, '') = coalesce(new.scope, '')
      order by total_time_ms asc, created_at asc, id asc
      limit 7
    );
  return null;
end;
$$;

drop trigger if exists trg_trim_leaderboard_runs on leaderboard_runs;
create trigger trg_trim_leaderboard_runs
  after insert or update of mode_id, scope, total_time_ms on leaderboard_runs
  for each row execute function trim_leaderboard_runs();

revoke all on function trim_leaderboard_runs() from public, anon, authenticated;

alter table leaderboard_runs enable row level security;

drop policy if exists "public can read leaderboard" on leaderboard_runs;
create policy "public can read leaderboard"
  on leaderboard_runs for select
  using (true);

-- Public-read, server-only-write: no insert/update/delete policy for anon/authenticated.
-- Writes go through the Next.js route using the secret key (BYPASSRLS).
-- Do not FORCE RLS — the trim trigger runs as the table owner and must be able to delete.
revoke all on table leaderboard_runs from public, anon, authenticated;
grant select on table leaderboard_runs to anon, authenticated;
grant all on table leaderboard_runs to service_role;

-- ── Atomic quota reservation ────────────────────────────────────────────────
-- Reserves up to p_requested comments against a monthly limit in one locked
-- statement, so parallel requests can't overshoot. Returns the amount granted
-- (0 when the quota is used up). A negative p_requested refunds unused
-- reservation. p_limit < 0 means unlimited.
create or replace function public.reserve_monthly_usage(
  p_user_id uuid,
  p_month text,
  p_requested int,
  p_limit int
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  granted int;
begin
  insert into monthly_usage (user_id, month, comment_count)
  values (p_user_id, p_month, 0)
  on conflict (user_id, month) do nothing;

  select comment_count into current_count
  from monthly_usage
  where user_id = p_user_id and month = p_month
  for update;

  if p_requested < 0 then
    granted := greatest(p_requested, -current_count);
  elsif p_limit < 0 then
    granted := p_requested;
  else
    granted := least(p_requested, greatest(0, p_limit - current_count));
  end if;

  update monthly_usage
  set comment_count = current_count + granted, updated_at = now()
  where user_id = p_user_id and month = p_month;

  return granted;
end;
$$;

revoke all on function public.reserve_monthly_usage(uuid, text, int, int) from public, anon, authenticated;
grant execute on function public.reserve_monthly_usage(uuid, text, int, int) to service_role;

-- Daily comment allowance for signed-out users, keyed by a hashed IP
create table if not exists public.anon_usage (
  ip_hash text not null,
  day text not null, -- 'YYYY-MM-DD'
  comment_count int not null default 0,
  updated_at timestamptz default now(),
  primary key (ip_hash, day)
);

alter table public.anon_usage enable row level security;
-- No policies: service role only

create or replace function public.reserve_anon_usage(
  p_ip_hash text,
  p_day text,
  p_requested int,
  p_limit int
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  granted int;
begin
  insert into anon_usage (ip_hash, day, comment_count)
  values (p_ip_hash, p_day, 0)
  on conflict (ip_hash, day) do nothing;

  select comment_count into current_count
  from anon_usage
  where ip_hash = p_ip_hash and day = p_day
  for update;

  if p_requested < 0 then
    granted := greatest(p_requested, -current_count);
  else
    granted := least(p_requested, greatest(0, p_limit - current_count));
  end if;

  update anon_usage
  set comment_count = current_count + granted, updated_at = now()
  where ip_hash = p_ip_hash and day = p_day;

  return granted;
end;
$$;

revoke all on function public.reserve_anon_usage(text, text, int, int) from public, anon, authenticated;
grant execute on function public.reserve_anon_usage(text, text, int, int) to service_role;

-- ── RLS hardening ───────────────────────────────────────────────────────────
-- All subscription, team and API-key writes go through server routes using the
-- service role (which bypasses RLS), so users get read access to their own rows only.

-- These were created outside the repo with `true` checks for every role, which let
-- anyone holding the public anon key insert or update any subscription row.
-- The signup trigger is security definer, so it doesn't need them.
drop policy if exists "subscriptions_service_insert" on public.subscriptions;
drop policy if exists "subscriptions_service_update" on public.subscriptions;

drop policy if exists "Owner can update their team" on public.teams;
drop policy if exists "Owner can insert team" on public.teams;

drop policy if exists "Team members can view team members" on public.team_members;
drop policy if exists "Team admins can insert members" on public.team_members;
drop policy if exists "Team admins can update members" on public.team_members;
drop policy if exists "Team admins can delete members" on public.team_members;

create policy "Users can view own memberships"
  on public.team_members for select
  using (auth.uid() = user_id);

drop policy if exists "Team admins can create invitations" on public.team_invitations;
drop policy if exists "Team admins can update invitations" on public.team_invitations;

-- Legacy schema.sql policy; the api_keys migration already adds a select-only one
drop policy if exists "Users can manage own api keys" on public.api_keys;

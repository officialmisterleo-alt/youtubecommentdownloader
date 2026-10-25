-- ── Atomic AI analysis usage ────────────────────────────────────────────────
-- Checks the per-minute rate limit and monthly analysis/comment limits and
-- records one analysis in a single locked transaction, so parallel requests
-- can't each read the same count and overwrite each other.
-- Returns 'ok', 'rate_limited' or 'monthly_limit'.
create or replace function public.reserve_ai_analysis(
  p_user_id uuid,
  p_month text,
  p_minute text,
  p_comments int,
  p_max_analyses int,
  p_max_comments int,
  p_max_per_minute int
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  month_analyses int;
  month_comments int;
  minute_requests int;
begin
  insert into ai_analysis_usage (user_id, month)
  values (p_user_id, p_month)
  on conflict (user_id, month) do nothing;

  insert into ai_analysis_rate_limits (user_id, minute)
  values (p_user_id, p_minute)
  on conflict (user_id, minute) do nothing;

  select analysis_count, comment_count into month_analyses, month_comments
  from ai_analysis_usage
  where user_id = p_user_id and month = p_month
  for update;

  select request_count into minute_requests
  from ai_analysis_rate_limits
  where user_id = p_user_id and minute = p_minute
  for update;

  if minute_requests >= p_max_per_minute then
    return 'rate_limited';
  end if;

  if month_analyses + 1 > p_max_analyses or month_comments + p_comments > p_max_comments then
    return 'monthly_limit';
  end if;

  update ai_analysis_usage
  set analysis_count = month_analyses + 1,
      comment_count = month_comments + p_comments,
      updated_at = now()
  where user_id = p_user_id and month = p_month;

  update ai_analysis_rate_limits
  set request_count = minute_requests + 1, updated_at = now()
  where user_id = p_user_id and minute = p_minute;

  return 'ok';
end;
$$;

revoke all on function public.reserve_ai_analysis(uuid, text, text, int, int, int, int) from public, anon, authenticated;
grant execute on function public.reserve_ai_analysis(uuid, text, text, int, int, int, int) to service_role;

-- ── Staged analysis sessions ────────────────────────────────────────────────
-- A large analysis runs as one 'start' call plus many chunk/merge calls. The
-- session holds the budget reserved at start, so chunk calls can't analyze more
-- comments than were paid for, and merges are capped.
create table if not exists public.ai_analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  analysis_type text not null,
  remaining_comments int not null,
  remaining_merges int not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.ai_analysis_sessions enable row level security;
-- No policies: service role only

create index if not exists ai_analysis_sessions_expires_at_idx
  on public.ai_analysis_sessions (expires_at);

-- Spends from a session's budget; returns false if the session is unknown,
-- belongs to someone else, has expired, or doesn't have enough left.
create or replace function public.consume_ai_session(
  p_session_id uuid,
  p_user_id uuid,
  p_analysis_type text,
  p_comments int,
  p_merge boolean
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_merge then
    update ai_analysis_sessions
    set remaining_merges = remaining_merges - 1
    where id = p_session_id and user_id = p_user_id and analysis_type = p_analysis_type
      and expires_at > now() and remaining_merges > 0;
  else
    update ai_analysis_sessions
    set remaining_comments = remaining_comments - p_comments
    where id = p_session_id and user_id = p_user_id and analysis_type = p_analysis_type
      and expires_at > now() and p_comments > 0 and remaining_comments >= p_comments;
  end if;
  return found;
end;
$$;

revoke all on function public.consume_ai_session(uuid, uuid, text, int, boolean) from public, anon, authenticated;
grant execute on function public.consume_ai_session(uuid, uuid, text, int, boolean) to service_role;

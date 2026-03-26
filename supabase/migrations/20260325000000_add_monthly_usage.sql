-- Monthly usage tracking for quota enforcement
create table public.monthly_usage (
  user_id uuid references auth.users on delete cascade not null,
  month   text not null,  -- 'YYYY-MM'
  comment_count int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, month)
);

alter table public.monthly_usage enable row level security;

-- Users can read their own usage (for the /api/quota endpoint via user session)
create policy "Users can view own monthly usage"
  on public.monthly_usage for select
  using (auth.uid() = user_id);

-- Writes are done exclusively via the service role key (server-side only)
-- No user-facing insert/update policies needed

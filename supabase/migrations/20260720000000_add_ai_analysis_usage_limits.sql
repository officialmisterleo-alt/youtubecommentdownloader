-- AI analysis usage tracking for cost controls.
create table if not exists public.ai_analysis_usage (
  user_id uuid references auth.users on delete cascade not null,
  month text not null,
  analysis_count int not null default 0,
  comment_count int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, month)
);

alter table public.ai_analysis_usage enable row level security;

create policy "Users can view own AI analysis usage"
  on public.ai_analysis_usage for select
  using (auth.uid() = user_id);

-- Short-window request counts. Writes are service-role only.
create table if not exists public.ai_analysis_rate_limits (
  user_id uuid references auth.users on delete cascade not null,
  minute text not null,
  request_count int not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, minute)
);

alter table public.ai_analysis_rate_limits enable row level security;

create index if not exists ai_analysis_rate_limits_updated_at_idx
  on public.ai_analysis_rate_limits (updated_at);

-- Monthly comment usage tracking
-- Run this in Supabase SQL editor or via: supabase db push
--
-- IMPORTANT: After creating this table, also run the existing schema.sql
-- if the `usage` table (used by prior code) was never created. This table
-- replaces it for monthly comment cap enforcement.

create table if not exists public.monthly_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  year_month text not null,           -- e.g. '2026-03'
  comments_fetched integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, year_month)
);

alter table public.monthly_usage enable row level security;

-- Users can read their own row (for dashboard display)
create policy "Users can read own usage"
  on public.monthly_usage for select
  using (auth.uid() = user_id);

-- Service role key bypasses RLS and can insert/update freely

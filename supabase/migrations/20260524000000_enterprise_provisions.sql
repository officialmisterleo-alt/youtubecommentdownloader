create table if not exists public.enterprise_provisions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  team_name text not null,
  max_seats integer not null default 10,
  claimed boolean not null default false,
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.enterprise_provisions enable row level security;
-- Only service role can access this table (no public policies)

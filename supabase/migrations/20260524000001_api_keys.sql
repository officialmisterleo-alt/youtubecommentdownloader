create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  key_hash text not null,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  regenerated_at timestamptz
);

alter table public.api_keys enable row level security;

create policy "Users can view own api key"
  on public.api_keys for select
  using (auth.uid() = user_id);

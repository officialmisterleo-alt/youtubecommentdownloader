-- Users profile (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  plan text default 'free' check (plan in ('free','pro','business','enterprise')),
  exports_this_month int default 0,
  comments_this_month int default 0,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Exports
create table public.exports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  url text not null,
  video_id text,
  format text not null,
  comment_count int default 0,
  status text default 'pending' check (status in ('pending','processing','completed','failed')),
  file_url text,
  created_at timestamptz default now()
);
alter table public.exports enable row level security;
create policy "Users can manage own exports" on public.exports for all using (auth.uid() = user_id);

-- Subscriptions
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  status text default 'active',
  lifetime boolean default false,
  current_period_end timestamptz,
  created_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- API Keys
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  last_used_at timestamptz,
  created_at timestamptz default now()
);
alter table public.api_keys enable row level security;
create policy "Users can manage own api keys" on public.api_keys for all using (auth.uid() = user_id);

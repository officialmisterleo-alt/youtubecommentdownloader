-- Create a default free subscription row for every new user on signup.
-- Existing users without a row are already handled gracefully by the app code.
create or replace function public.handle_new_user_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status, stripe_customer_id)
  values (new.id, 'free', 'active', null)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_user_subscription();

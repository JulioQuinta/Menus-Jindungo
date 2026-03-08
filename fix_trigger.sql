-- Fix the trigger to use 'admin' or 'client' (using 'admin' to keep consistency with the previous structure where users own restaurants)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

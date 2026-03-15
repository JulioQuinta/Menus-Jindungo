-- Create restaurant_staff table to manage sub-accounts
create table if not exists public.restaurant_staff (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade , 
  email text,
  name text not null,
  role text not null check (role in ('admin', 'waiter', 'kitchen', 'reception')),
  pin_code text, -- PIN for quick access on tablets
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(restaurant_id, email),
  unique(restaurant_id, pin_code)
);

-- Enable RLS
alter table public.restaurant_staff enable row level security;

-- Policies
create policy "Owners can manage staff"
  on public.restaurant_staff
  for all
  using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_staff.restaurant_id
      and r.owner_id = auth.uid()
    )
  );

create policy "Users can view their staff records"
  on public.restaurant_staff
  for select
  using (
    auth.uid() = user_id 
    or email = (select email from auth.users where id = auth.uid())
  );

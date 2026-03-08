
-- Drop existing policies if any
drop policy if exists "Logos Public Access" on storage.objects;
drop policy if exists "Logos Upload Access" on storage.objects;

-- Ensure bucket exists (idempotent-ish trick or just insert)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Re-create policies allowing public access (simplest for now)
create policy "Logos Public Access"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Logos Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'logos' );

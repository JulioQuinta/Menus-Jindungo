
-- Force drop everything related to logos
delete from storage.buckets where name = 'logos';

-- Re-create bucket
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true);

-- Re-apply policies (Public Read/Write)
drop policy if exists "Logos Public Access" on storage.objects;
drop policy if exists "Logos Upload Access" on storage.objects;
drop policy if exists "Logos Public Insert" on storage.objects;

create policy "Logos Public Access"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Logos Public Insert"
  on storage.objects for insert
  with check ( bucket_id = 'logos' );

create policy "Logos Public Update"
  on storage.objects for update
  using ( bucket_id = 'logos' );

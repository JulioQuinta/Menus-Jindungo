
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true);

create policy "Logos Public Access"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Logos Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'logos' );

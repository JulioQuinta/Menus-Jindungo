
-- 1. Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'logos';

-- 2. Check policies on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

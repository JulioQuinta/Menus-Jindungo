
-- 1. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Try to insert a dummy object directly (simulating an upload)
-- This bypasses the API but checks if the FK constraint on bucket_id works
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('logos', 'test_sql_insert.txt', auth.uid(), '{"mimetype": "text/plain"}')
ON CONFLICT (bucket_id, name) DO NOTHING;

-- 3. Check if we can see it
SELECT * FROM storage.objects WHERE bucket_id = 'logos';

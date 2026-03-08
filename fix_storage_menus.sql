
-- FIX STORAGE BUCKET 'menus' PUBLIC ACCESS

-- 1. Force the bucket to be public
INSERT INTO storage.buckets (id, name, public)
VALUES ('menus', 'menus', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Menus" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Menus" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;

-- 3. Create Permissive Policies
-- Allow anyone (anon included) to READ files in 'menus'
CREATE POLICY "Public Read Menus"
ON storage.objects FOR SELECT
USING ( bucket_id = 'menus' );

-- Allow authenticated users (like the admin) to UPLOAD/INSERT
CREATE POLICY "Allow Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'menus' );

-- Allow owners to UPDATE/DELETE (simple version: allow auth users for now)
CREATE POLICY "Allow Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'menus' );

CREATE POLICY "Allow Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'menus' );

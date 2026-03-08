
-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Logos" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;
DROP POLICY IF EXISTS "Liberar Upload Geral de Logos" ON storage.objects;

-- 3. Create a single, permissive policy for the logos bucket
CREATE POLICY "Public Access Logos"
ON storage.objects FOR ALL
TO public
USING ( bucket_id = 'logos' )
WITH CHECK ( bucket_id = 'logos' );


-- Transaction to ensure atomic operations
BEGIN;

-- Attempt to delete the bucket if it exists (cascade will handle objects/policies usually, but let's be safe)
DELETE FROM storage.buckets WHERE name = 'logos';

-- Re-insert the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Drop policies if they exist (using DO block to avoid errors if they don't)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Logos Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Logos Upload Access" ON storage.objects;
    DROP POLICY IF EXISTS "Logos Public Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Logos Public Update" ON storage.objects;
    DROP POLICY IF EXISTS "Give me access to own folder" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create permissive policies for the 'logos' bucket
CREATE POLICY "Logos Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

CREATE POLICY "Logos Public Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' );

CREATE POLICY "Logos Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' );

COMMIT;

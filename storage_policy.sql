-- 1. Create the 'menus' bucket (If not exists)
-- Note: This usually requires the 'storage' extension which is default in Supabase.
INSERT INTO storage.buckets (id, name, public)
VALUES ('menus', 'menus', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Skipped - Managed by System)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access (Everyone can see menu photos)
-- Drop if exists to avoid errors on re-run
DROP POLICY IF EXISTS "Public Read Menus" ON storage.objects;

CREATE POLICY "Public Read Menus"
ON storage.objects FOR SELECT
USING ( bucket_id = 'menus' );

-- 4. Policy: Authenticated Uploads (Ideally restricted to owner, but for MVP/Anonymous we allow public for now)
-- WARNING: In a real app, use "TO authenticated" and check owner_id.
DROP POLICY IF EXISTS "Public Upload Menus" ON storage.objects;

CREATE POLICY "Public Upload Menus"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'menus' );

-- 5. Policy: Allow Update/Delete (Optional for MVP)
DROP POLICY IF EXISTS "Public Update Menus" ON storage.objects;

CREATE POLICY "Public Update Menus"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'menus' );

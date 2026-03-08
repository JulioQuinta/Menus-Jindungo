-- 1. Create the 'menus' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menus', 'menus', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies on 'menus' bucket to avoid conflicts if redefining
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;

-- 3. Create Policy: Publicly readable
CREATE POLICY "Public menus access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'menus' );

-- 4. Create Policy: Authenticated users can INSERT (upload new files)
CREATE POLICY "Users can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'menus' );

-- 5. Create Policy: Authenticated users can UPDATE their files
CREATE POLICY "Users can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'menus' );

-- 6. Create Policy: Authenticated users can DELETE their files
CREATE POLICY "Users can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'menus' );

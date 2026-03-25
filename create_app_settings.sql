-- create_app_settings.sql

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    logo_url TEXT NOT NULL DEFAULT '/jindungo_logo_v3.png',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default row if not exists
INSERT INTO public.app_settings (id, logo_url)
VALUES ('global', '/jindungo_logo_v3.png')
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Everyone can read the settings
CREATE POLICY "Enable read access for all users" ON public.app_settings
    FOR SELECT USING (true);

-- Only Super Admins can update
CREATE POLICY "Super admins can update settings" ON public.app_settings
    FOR UPDATE 
    USING (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
    )
    WITH CHECK (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
    );

-- Also allow insert for super admin if needed
CREATE POLICY "Super admins can insert settings" ON public.app_settings
    FOR INSERT 
    WITH CHECK (
      auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
    );

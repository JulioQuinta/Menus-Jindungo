-- Add status column to profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned'));
    END IF;
END $$;

-- Allow Super Admins to update any profile (to change roles and ban users)
CREATE POLICY "Super Admins can update any profile" ON profiles
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'super_admin'
  )
);

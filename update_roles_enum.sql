-- Migration to update roles to new hierarchy

-- 1. Remove the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migrate existing 'owner' users to 'admin' (standardizing the role name)
UPDATE public.profiles SET role = 'admin' WHERE role = 'owner';

-- 3. Add the new constraint with the updated roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('super_admin', 'admin', 'client'));

-- 4. Set the default role to 'client' (safer default for new signups)
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'client';

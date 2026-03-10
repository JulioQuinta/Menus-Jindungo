-- Create staff members table for waiter management
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Garçom',
    pin_code TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can manage their staff
DROP POLICY IF EXISTS "Dono pode gerenciar staff" ON public.staff_members;
CREATE POLICY "Dono pode gerenciar staff" 
ON public.staff_members 
FOR ALL 
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants 
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Super Admins can see/manage everything (from existing setup)
DROP POLICY IF EXISTS "Super admins can manage staff" ON public.staff_members;
CREATE POLICY "Super admins can manage staff" 
ON public.staff_members 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_super_admin = true
    )
);

-- Policy: Publicly readable for testing/login purposes (adjust in production if needed)
DROP POLICY IF EXISTS "Staff elements can be read by anyone" ON public.staff_members;
CREATE POLICY "Staff elements can be read by anyone"
ON public.staff_members
FOR SELECT
USING (true);

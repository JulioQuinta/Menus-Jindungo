-- Add staff tracking columns to orders table
ALTER TABLE IF EXISTS public.orders 
ADD COLUMN IF NOT EXISTS staff_member_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS staff_member_name TEXT;

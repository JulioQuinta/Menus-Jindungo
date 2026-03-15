-- UNIVERSAL FIX - Execute this in Supabase SQL Editor
-- This ensures ALL columns and tables exist correctly.

-- 1. Ensure BUSINESS_INFO column exists in RESTAURANTS
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure REJECTION_REASON column exists in ORDERS
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Ensure CUSTOMER_PHONE column exists in ORDERS
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 4. Create LOYALTY_CONFIGS table
CREATE TABLE IF NOT EXISTS public.loyalty_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    goal INTEGER NOT NULL DEFAULT 10,
    reward_text TEXT NOT NULL DEFAULT 'Ganha uma surpresa!',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id)
);

-- 5. Create COUPONS table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id, code)
);

-- 6. Update Row Level Security (RLS) policies 
-- This ensures you have permission to save even if the table was created by another script
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to update the restaurant they 'own' (standard check)
-- We use a DROP and CREATE to be sure it's the correct policy
DROP POLICY IF EXISTS "Owners can update their own restaurants" ON public.restaurants;
CREATE POLICY "Owners can update their own restaurants" ON public.restaurants 
    FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can select their own restaurants" ON public.restaurants;
CREATE POLICY "Owners can select their own restaurants" ON public.restaurants 
    FOR SELECT USING (auth.uid() = owner_id);

-- Fix Loyalty Policies
DROP POLICY IF EXISTS "Owners can manage their loyalty configs" ON public.loyalty_configs;
CREATE POLICY "Owners can manage their loyalty configs" ON public.loyalty_configs
    FOR ALL USING (
        auth.uid() IN (SELECT owner_id FROM public.restaurants WHERE id = restaurant_id)
    );

-- Fix Coupon Policies
DROP POLICY IF EXISTS "Owners can manage their coupons" ON public.coupons;
CREATE POLICY "Owners can manage their coupons" ON public.coupons
    FOR ALL USING (
        auth.uid() IN (SELECT owner_id FROM public.restaurants WHERE id = restaurant_id)
    );

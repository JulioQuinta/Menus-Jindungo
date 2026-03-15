-- Consolidated SQL for Loyalty, Marketing and CRM
-- Run this in your Supabase SQL Editor

-- 1. Create loyalty_configs table
CREATE TABLE IF NOT EXISTS public.loyalty_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    goal INTEGER NOT NULL DEFAULT 10,
    reward_text TEXT NOT NULL DEFAULT 'Ganha uma surpresa!',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id)
);

-- 2. Create coupons table
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

-- 3. Ensure customer_phone exists for CRM/Loyalty
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
COMMENT ON COLUMN public.orders.customer_phone IS 'Número de WhatsApp do cliente para CRM e fidelização';

-- 4. Enable RLS
ALTER TABLE public.loyalty_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 5. Policies for loyalty_configs
DROP POLICY IF EXISTS "Public can view active loyalty configs" ON public.loyalty_configs;
CREATE POLICY "Public can view active loyalty configs" ON public.loyalty_configs
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage their loyalty configs" ON public.loyalty_configs;
CREATE POLICY "Owners can manage their loyalty configs" ON public.loyalty_configs
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.restaurants WHERE id = restaurant_id
        )
    );

-- 6. Policies for coupons
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage their coupons" ON public.coupons;
CREATE POLICY "Owners can manage their coupons" ON public.coupons
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.restaurants WHERE id = restaurant_id
        )
    );

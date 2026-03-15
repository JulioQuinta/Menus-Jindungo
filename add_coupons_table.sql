-- Create coupons table for Stage 2 Marketing Features
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    valid_until TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id, code)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Owners can manage their coupons" ON public.coupons
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.restaurants WHERE id = restaurant_id
        )
    );

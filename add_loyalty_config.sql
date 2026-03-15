-- Create loyalty_configs table for Corporate plan
CREATE TABLE IF NOT EXISTS public.loyalty_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    goal INTEGER NOT NULL DEFAULT 10,
    reward_text TEXT NOT NULL DEFAULT 'Ganha uma surpresa!',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id)
);

-- Enable RLS
ALTER TABLE public.loyalty_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active loyalty configs" ON public.loyalty_configs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their loyalty configs" ON public.loyalty_configs
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.restaurants WHERE id = restaurant_id
        )
    );

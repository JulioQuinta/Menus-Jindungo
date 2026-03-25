-- Create the feedbacks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert a feedback (public) if they have an order or just anonymously
CREATE POLICY "Anyone can insert feedbacks" 
ON public.feedbacks 
FOR INSERT 
WITH CHECK (true);

-- Policy: Only restaurant owners can view their own feedbacks
CREATE POLICY "Owners can view their own feedbacks" 
ON public.feedbacks 
FOR SELECT 
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
);

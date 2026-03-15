-- Add business_info to restaurants for Corporate plan
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{
    "opening_hours": [],
    "location": {"address": "", "maps_link": ""},
    "socials": {"instagram": "", "facebook": "", "phone": ""},
    "share_text": "Veja o nosso menu digital!"
}'::jsonb;

-- Add rejection_reason to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comment for clarity
COMMENT ON COLUMN public.restaurants.business_info IS 'Store hours, location and social links for Corporate plan';
COMMENT ON COLUMN public.orders.rejection_reason IS 'Reason why an order was cancelled/rejected by admin';

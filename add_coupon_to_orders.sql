-- Add coupon tracking to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;

-- Optional: Add a comment
COMMENT ON COLUMN public.orders.coupon_discount IS 'Valor monetário do desconto aplicado via cupão';

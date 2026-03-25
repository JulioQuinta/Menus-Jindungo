-- Add loyalty redemption tracking to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_loyalty_redemption BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loyalty_reward_text TEXT;

-- Index for performance in loyalty queries
CREATE INDEX IF NOT EXISTS idx_orders_loyalty_redemption ON public.orders(customer_phone) WHERE is_loyalty_redemption = true;

COMMENT ON COLUMN public.orders.is_loyalty_redemption IS 'Indica se este pedido foi um resgate de fidelização (prémio)';
COMMENT ON COLUMN public.orders.loyalty_reward_text IS 'O texto do prémio resgatado no momento do pedido';

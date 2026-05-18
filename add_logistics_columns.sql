-- ====================================================================
-- Módulo de Logística, Entregas e Takeaway - Migração SQL
-- ====================================================================

-- Adiciona colunas dedicadas à tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type text DEFAULT 'dine-in',
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_neighborhood text,
ADD COLUMN IF NOT EXISTS delivery_reference text,
ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS takeaway_time text,
ADD COLUMN IF NOT EXISTS courier_name text,
ADD COLUMN IF NOT EXISTS courier_phone text,
ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;

-- Comentários descritivos para o esquema
COMMENT ON COLUMN public.orders.order_type IS 'Modalidade do pedido: dine-in, takeaway ou delivery';
COMMENT ON COLUMN public.orders.delivery_address IS 'Morada completa para entrega';
COMMENT ON COLUMN public.orders.delivery_neighborhood IS 'Bairro / Zona selecionada';
COMMENT ON COLUMN public.orders.delivery_reference IS 'Ponto de referência da morada';
COMMENT ON COLUMN public.orders.delivery_fee IS 'Taxa de entrega cobrada';
COMMENT ON COLUMN public.orders.takeaway_time IS 'Tempo estimado para recolha ao balcão';
COMMENT ON COLUMN public.orders.courier_name IS 'Nome do estafeta atribuído';
COMMENT ON COLUMN public.orders.courier_phone IS 'Telemóvel do estafeta atribuído';
COMMENT ON COLUMN public.orders.dispatched_at IS 'Data/hora do despacho para entrega';

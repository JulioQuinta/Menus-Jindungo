-- ====================================================================
-- SCRIPT: CRIAÇÃO DA TABELA DE MOVIMENTOS DE STOCK (INVENTÁRIO)
-- ====================================================================
-- Este script cria a tabela 'stock_movements' no Supabase para sincronizar
-- o histórico de ajustes de stock registados localmente/offline nos POS.

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    cost_price NUMERIC(15,2),
    supplier_name TEXT,
    user_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- HABILITAR SEGURANÇA (ROW LEVEL SECURITY)
-- ------------------------------------------------------------
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Remover políticas se existirem
DROP POLICY IF EXISTS "Owners and admins can manage stock_movements" ON public.stock_movements;

-- Criar política de gestão integral para Donos e Administradores
CREATE POLICY "Owners and admins can manage stock_movements" 
ON public.stock_movements 
FOR ALL 
TO authenticated 
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role IN ('super_admin', 'admin') OR is_super_admin = true)
    )
)
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role IN ('super_admin', 'admin') OR is_super_admin = true)
    )
);

-- Criar índices de performance para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_stock_movements_restaurant_id ON public.stock_movements(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON public.stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

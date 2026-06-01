-- ====================================================================
-- SCRIPT: OTIMIZAÇÃO DE DESEMPENHO (ÍNDICES COMPOSTOS NO SUPABASE)
-- ====================================================================
-- Este script cria índices estratégicos no banco de dados para agilizar
-- a leitura do cardápio pelos clientes e otimizar o painel de pedidos (KDS).

-- 1. Índice composto para carregamento ultra-rápido do cardápio ativo do restaurante
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_category 
ON public.menu_items (restaurant_id, category_id) 
WHERE available = true;

-- 2. Índice para busca instantânea de restaurantes pelo slug de URL
CREATE INDEX IF NOT EXISTS idx_restaurants_slug 
ON public.restaurants (slug) 
WHERE status IN ('active', 'trial');

-- 3. Índice para a tabela de pedidos ativos (agiliza o painel Kitchen Display System - KDS)
CREATE INDEX IF NOT EXISTS idx_orders_active_restaurant 
ON public.orders (restaurant_id, status) 
WHERE status NOT IN ('delivered', 'cancelled');

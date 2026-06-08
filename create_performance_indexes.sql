-- ====================================================================
-- SCRIPT: ÍNDICES DE DESEMPENHO E VELOCIDADE DE CARREGAMENTO
-- ====================================================================
-- Este script otimiza as chaves estrangeiras e campos de filtragem/ordenação
-- mais frequentes na base de dados para acelerar o tempo de resposta da API.

-- 1. Índices para Joins na leitura do Cardápio (Restaurants -> Categories -> Menu Items)
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id 
ON public.categories(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id 
ON public.menu_items(category_id);

-- 2. Índices para Rastreio e Consultas no Histórico de Pedidos (KDS e Cliente)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id 
ON public.orders(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone 
ON public.orders(customer_phone);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON public.orders(created_at DESC);

-- 3. Índices para Notificações de Empregados de Mesa (Garçom)
CREATE INDEX IF NOT EXISTS idx_notificacoes_garcom_restaurant_id 
ON public.notificacoes_garcom(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_garcom_created_at 
ON public.notificacoes_garcom(created_at DESC);

-- 4. Índice para Fila de Mensagens de WhatsApp (Despacho ultra-rápido)
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_pending 
ON public.whatsapp_outbox_messages(restaurant_id, status) 
WHERE status = 'pending';

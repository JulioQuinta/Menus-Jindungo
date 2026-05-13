-- ==========================================
-- JINDUNGO SECURITY SHIELD (RLS)
-- Versão: 1.0 (Incremental e Segura)
-- ==========================================

-- ------------------------------------------
-- 1. TABELA: ORDERS (A mais sensível)
-- ------------------------------------------

-- Ativar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- [POLÍTICA] Criar pedidos (Qualquer pessoa pode pedir)
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- [POLÍTICA] Ver pedidos (Dono vê tudo, Público vê apenas se tiver o ID)
-- Nota: O Supabase já filtra por ID na query, mas aqui reforçamos a segurança.
DROP POLICY IF EXISTS "Owners see all their orders" ON public.orders;
CREATE POLICY "Owners see all their orders" ON public.orders
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
    );

-- [POLÍTICA] Atualização pelo Motoboy/Sistema Público
-- Só permite atualizar pedidos que não estejam cancelados ou pagos
DROP POLICY IF EXISTS "Public can update active orders" ON public.orders;
CREATE POLICY "Public can update active orders" ON public.orders
    FOR UPDATE USING (status NOT IN ('cancelled', 'paid', 'delivered'))
    WITH CHECK (status NOT IN ('cancelled', 'paid'));

-- ------------------------------------------
-- 2. TABELA: MENU_ITEMS & CATEGORIES
-- ------------------------------------------

-- Garantir que apenas o dono pode apagar/editar
DROP POLICY IF EXISTS "Owners manage menu_items" ON public.menu_items;
CREATE POLICY "Owners manage menu_items" ON public.menu_items
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owners manage categories" ON public.categories;
CREATE POLICY "Owners manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
    );

-- ------------------------------------------
-- 3. TABELA: RESTAURANTS (Proteção de Perfil)
-- ------------------------------------------

DROP POLICY IF EXISTS "Owners manage their restaurant" ON public.restaurants;
CREATE POLICY "Owners manage their restaurant" ON public.restaurants
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- ==========================================
-- COMANDOS DE ROLLBACK (CASO ALGO FALHE)
-- Execute as linhas abaixo se a app parar de funcionar!
-- ==========================================
/*
-- Para Restaurar o Acesso Público Total (Estado Anterior):
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can update active orders" ON public.orders;
CREATE POLICY "Public view everything" ON orders FOR SELECT USING (true);
CREATE POLICY "Public update everything" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public insert everything" ON orders FOR INSERT WITH CHECK (true);
*/

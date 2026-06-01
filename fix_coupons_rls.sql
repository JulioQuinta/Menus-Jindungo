-- =====================================================================
-- MIGRAÇÃO: Ajuste de RLS na Tabela public.coupons
-- OBJETIVO: Permitir que clientes anónimos leiam e validem cupões ativados,
--           enquanto apenas donos e administradores do restaurante
--           possam inserir, atualizar ou eliminar cupões.
-- =====================================================================

-- 1. Garantir que a RLS está ativa na tabela de cupões
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas para evitar duplicados ou conflitos
DROP POLICY IF EXISTS "Permitir leitura pública de cupões ativos" ON public.coupons;
DROP POLICY IF EXISTS "Permitir gestão de cupões apenas para administradores" ON public.coupons;
DROP POLICY IF EXISTS "Public select active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Restaurant owners manage coupons" ON public.coupons;

-- 3. Criar a política de LEITURA (SELECT) pública
-- Qualquer cliente (público ou autenticado) precisa consultar e ler os cupões para validá-los
CREATE POLICY "Permitir leitura pública de cupões ativos"
ON public.coupons
FOR SELECT
USING (is_active = true);

-- 4. Criar a política de GESTÃO (INSERT, UPDATE, DELETE) para Administradores
-- Apenas donos do restaurante ou usuários com papel de 'admin' ou 'super_admin' podem gerir
CREATE POLICY "Permitir gestão de cupões apenas para administradores"
ON public.coupons
FOR ALL
TO authenticated
USING (
    -- O usuário é o dono do restaurante associado ao cupão
    EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = coupons.restaurant_id
        AND r.owner_id = auth.uid()
    )
    OR
    -- Ou o usuário é um administrador geral / super_admin
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.id = coupons.restaurant_id
        AND r.owner_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
);

-- Notificação de êxito na migração
COMMENT ON TABLE public.coupons IS 'Tabela de cupões com RLS robusta de marketing de alta performance ativa.';

-- ====================================================================
-- SCRIPT: ATUALIZAÇÃO DE RLS PARA GESTÃO DE MENU & INVENTÁRIO
-- ====================================================================
-- Este script corrige as políticas de Row Level Security (RLS) nas tabelas
-- 'menu_items' e 'categories'. A política antiga permitia alterações apenas
-- se o usuário fosse o dono exato do restaurante (owner_id = auth.uid()).
-- 
-- Esta nova versão expande as permissões de gravação para:
-- 1. O dono exato do restaurante (owner_id = auth.uid()).
-- 2. Qualquer perfil com papel 'super_admin' ou 'admin' na tabela profiles.
--
-- Isto resolve falhas silenciosas onde administradores/super_admins não
-- conseguiam atualizar o stock ou salvar novos itens.

-- ------------------------------------------------------------
-- 1. POLÍTICAS PARA A TABELA 'menu_items'
-- ------------------------------------------------------------
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de gerenciamento
DROP POLICY IF EXISTS "Owners manage menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Owners can manage menu items" ON public.menu_items;

-- Criar nova política abrangente para ALL (Insert, Update, Delete)
CREATE POLICY "Owners and admins can manage menu_items" 
ON public.menu_items 
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

-- ------------------------------------------------------------
-- 2. POLÍTICAS PARA A TABELA 'categories'
-- ------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de gerenciamento
DROP POLICY IF EXISTS "Owners manage categories" ON public.categories;
DROP POLICY IF EXISTS "Owners can manage categories" ON public.categories;

-- Criar nova política abrangente para ALL (Insert, Update, Delete)
CREATE POLICY "Owners and admins can manage categories" 
ON public.categories 
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

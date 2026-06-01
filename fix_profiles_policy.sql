-- ====================================================================
-- CORREÇÃO DA POLÍTICA DE SEGURANÇA E ESCALAÇÃO DE PRIVILÉGIOS (PROFILES)
-- ====================================================================
-- Execute este script no SQL Editor do Supabase para corrigir o erro
-- "policy already exists" e proteger a coluna 'role' contra invasões.

-- 1. Remover a política antiga se ela já existir (Evita o erro do screenshot)
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- 2. Recriar a política com segurança
CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. [SEGURANÇA EXTREMA] Impedir que qualquer usuário altere seu próprio 'role' (Cargo)
-- Isso evita que donos ou clientes subam seu cargo para 'super_admin'.
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o cargo (role) foi modificado E quem está atualizando não for um super_admin
  IF NEW.role <> OLD.role AND (
    SELECT COALESCE(role, 'client') 
    FROM public.profiles 
    WHERE id = auth.uid()
  ) <> 'super_admin' THEN
    RAISE EXCEPTION 'Erro de Segurança: Não tem permissão para alterar o seu próprio nível de acesso.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Associar a trigger de segurança à tabela profiles
DROP TRIGGER IF EXISTS tr_check_profile_role_update ON public.profiles;
CREATE TRIGGER tr_check_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE PROCEDURE public.check_profile_role_update();

-- 1. Cria uma função segura para verificar se o utilizador atual é Super Admin
-- O "SECURITY DEFINER" é crucial para evitar loops infinitos (recursividade) ao verificar a própria tabela profiles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (role = 'super_admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permite aos Super Admins atualizar perfis de outros utilizadores (Ex: aprovar, banir, mudar permissões)
DROP POLICY IF EXISTS "Super Admins can update profiles" ON public.profiles;
CREATE POLICY "Super Admins can update profiles" ON public.profiles
FOR UPDATE USING (public.is_super_admin());

-- 3. Permite aos Super Admins gerir restaurantes (Ex: criar novos, mudar status para ativo, apagar, renovar)
DROP POLICY IF EXISTS "Super Admins manage restaurants" ON public.restaurants;
CREATE POLICY "Super Admins manage restaurants" ON public.restaurants
FOR ALL USING (public.is_super_admin());

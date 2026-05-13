-- Função segura que executa as ações de aprovação do lado do servidor
-- Ao utilizar SECURITY DEFINER, esta função tem permissões totais para alterar a base de dados
-- ignorando os bloqueios de RLS normais, mas valida internamente se quem a chamou é Super Admin.

CREATE OR REPLACE FUNCTION public.approve_client(client_id uuid)
RETURNS void AS $$
BEGIN
  -- 1. Verificar se o utilizador logado é realmente Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'super_admin' OR is_super_admin = true)
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas Super Admins podem aprovar clientes.';
  END IF;

  -- 2. Ativar o Perfil
  UPDATE public.profiles
  SET status = 'active'
  WHERE id = client_id;

  -- 3. Ativar o Restaurante
  UPDATE public.restaurants
  SET status = 'active'
  WHERE owner_id = client_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

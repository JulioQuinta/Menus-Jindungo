-- ====================================================================
-- SCRIPT: ATIVAR CADASTROS PENDENTES (STATUS = 'PENDING')
-- ====================================================================
-- Este script atualiza as restrições da tabela 'profiles' para aceitar
-- o estado 'pending' (pendente de aprovação) e torná-lo o padrão para
-- novas contas de restaurantes.

-- 1. Remover a restrição antiga de status
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

-- 2. Adicionar a nova restrição contendo 'pending', 'active' e 'banned'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'banned', 'pending'));

-- 3. Definir 'pending' como padrão para novas contas
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';

-- 4. (Opcional) Colocar as contas existentes que não são super_admin como active
UPDATE public.profiles SET status = 'active' WHERE status IS NULL OR status = '';

-- Atualização da Tabela de Equipa / Staff
-- Este script adiciona a coluna de e-mail que estava em falta e garante que
-- não podemos ter dois funcionários com o mesmo PIN no mesmo restaurante.

ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar restrição (Constraint) para que o PIN seja único por restaurante
-- Remove primeiro se já existir para evitar erros
ALTER TABLE public.staff_members DROP CONSTRAINT IF EXISTS staff_members_restaurant_pin_key;
ALTER TABLE public.staff_members ADD CONSTRAINT staff_members_restaurant_pin_key UNIQUE(restaurant_id, pin_code);

-- ADICIONA SUPORTE A NOMES DE MESAS E OCUPAÇÃO
-- Permite que o restaurante defina seus nomes de mesas (letras, números, nomes)
-- E rastreie quais mesas estão ocupadas em cada reserva

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS assigned_tables TEXT[] DEFAULT '{}';

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS table_map JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.reservations.assigned_tables IS 'Lista de nomes/IDs das mesas atribuídas a esta reserva';
COMMENT ON COLUMN public.restaurants.table_map IS 'Lista de mesas disponíveis no restaurante (ex: ["1", "2", "A", "Sala VIP"])';

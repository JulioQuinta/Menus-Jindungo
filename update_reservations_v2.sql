-- UPDATES PARA RESERVAS
-- Adiciona número de mesas e motivo de rejeição

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS num_tables INTEGER DEFAULT 1;

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.reservations.num_tables IS 'Quantidade de mesas solicitadas pelo cliente';
COMMENT ON COLUMN public.reservations.rejection_reason IS 'Motivo caso a reserva seja recusada';

-- TABELA DE RESERVAS
-- Gerencia o agendamento de mesas nos restaurantes

CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    num_people INTEGER NOT NULL DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- 1. Restaurantes podem ver e gerir as suas próprias reservas
DROP POLICY IF EXISTS "Owners can manage their reservations" ON public.reservations;
CREATE POLICY "Owners can manage their reservations" ON public.reservations
    FOR ALL USING (
        auth.uid() IN (
            SELECT owner_id FROM public.restaurants WHERE id = restaurant_id
        )
    );

-- 2. Público pode criar reservas (inserir)
DROP POLICY IF EXISTS "Public can create reservations" ON public.reservations;
CREATE POLICY "Public can create reservations" ON public.reservations
    FOR INSERT WITH CHECK (true);

-- 3. Público pode ver a sua própria reserva (se filtrado por id/telemóvel - opcional para o futuro)
-- Por agora, apenas o admin vê a lista completa.

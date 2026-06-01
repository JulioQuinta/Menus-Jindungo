-- ====================================================================
-- MIGRAÇÃO SQL: Rastreamento Geográfico do Estafeta
-- OBJETIVO: Criar colunas de GPS para a posição ao vivo do motoboy
--           na tabela public.orders
-- ====================================================================

-- 1. Adicionar colunas de GPS na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_latitude numeric,
ADD COLUMN IF NOT EXISTS courier_longitude numeric;

-- Comentários descritivos para o esquema
COMMENT ON COLUMN public.orders.courier_latitude IS 'Coordenada de latitude em tempo real do estafeta';
COMMENT ON COLUMN public.orders.courier_longitude IS 'Coordenada de longitude em tempo real do estafeta';

-- 2. Recriar a função secure_order_updates para garantir 100% de integridade.
-- Note que o trigger já aceita por padrão atualizações de colunas não listadas 
-- no IF de bloqueio de campos sensíveis (como courier_latitude/longitude).
-- Mantemos a lógica anti-tampering robusta para evitar alterações indevidas.

CREATE OR REPLACE FUNCTION public.secure_order_updates()
RETURNS TRIGGER AS $$
DECLARE
    v_is_owner BOOLEAN := false;
BEGIN
    -- 1. Verificar se o utilizador autenticado é o dono do restaurante ou administrador/super_admin
    IF auth.uid() IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = OLD.restaurant_id AND r.owner_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND (p.role IN ('super_admin', 'admin') OR p.is_super_admin = true)
        ) INTO v_is_owner;
    END IF;

    -- 2. Se for o proprietário ou administrador, permitir qualquer atualização estrutural
    IF v_is_owner = true THEN
        RETURN NEW;
    END IF;

    -- 3. Se for um utilizador público (anónimo/estafeta):
    -- Bloquear alteração de qualquer campo sensível do pedido
    IF NEW.restaurant_id <> OLD.restaurant_id OR
       NEW.items <> OLD.items OR
       NEW.total <> OLD.total OR
       NEW.customer_name <> OLD.customer_name OR
       NEW.table_number <> OLD.table_number OR
       NEW.customer_phone <> OLD.customer_phone OR
       COALESCE(NEW.coupon_id, '00000000-0000-0000-0000-000000000000'::uuid) <> COALESCE(OLD.coupon_id, '00000000-0000-0000-0000-000000000000'::uuid) OR
       COALESCE(NEW.coupon_code, '') <> COALESCE(OLD.coupon_code, '') OR
       NEW.coupon_discount <> OLD.coupon_discount OR
       NEW.is_loyalty_redemption <> OLD.is_loyalty_redemption OR
       COALESCE(NEW.loyalty_reward_text, '') <> COALESCE(OLD.loyalty_reward_text, '') OR
       COALESCE(NEW.staff_member_id, '00000000-0000-0000-0000-000000000000'::uuid) <> COALESCE(OLD.staff_member_id, '00000000-0000-0000-0000-000000000000'::uuid) OR
       COALESCE(NEW.staff_member_name, '') <> COALESCE(OLD.staff_member_name, '') OR
       NEW.order_type <> OLD.order_type OR
       COALESCE(NEW.delivery_address, '') <> COALESCE(OLD.delivery_address, '') OR
       COALESCE(NEW.delivery_neighborhood, '') <> COALESCE(OLD.delivery_neighborhood, '') OR
       COALESCE(NEW.delivery_reference, '') <> COALESCE(OLD.delivery_reference, '') OR
       NEW.delivery_fee <> OLD.delivery_fee OR
       COALESCE(NEW.takeaway_time, '') <> COALESCE(OLD.takeaway_time, '')
    THEN
        RAISE EXCEPTION 'Erro de Segurança: Utilizadores públicos não podem alterar dados sensíveis do pedido.';
    END IF;

    -- 4. Validar rigidamente as transições de estado permitidas a utilizadores anónimos
    IF NEW.status <> OLD.status THEN
        -- Transição A: waiting_payment -> cancelled (Falha de Multicaixa no checkout)
        IF OLD.status = 'waiting_payment' AND NEW.status = 'cancelled' THEN
            RETURN NEW;
        -- Transição B: out_for_delivery -> arrived (Chegada do Estafeta)
        ELSIF OLD.status = 'out_for_delivery' AND NEW.status = 'arrived' THEN
            RETURN NEW;
        -- Transição C: arrived -> delivered (Finalização da Entrega)
        ELSIF OLD.status = 'arrived' AND NEW.status = 'delivered' THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Erro de Segurança: Transição de estado de pedido inválida para utilizador público (% -> %).', OLD.status, NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-aplicar o trigger
DROP TRIGGER IF EXISTS tr_secure_order_updates ON public.orders;
CREATE TRIGGER tr_secure_order_updates
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.secure_order_updates();

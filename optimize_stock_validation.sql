-- ====================================================================
-- SCRIPT: CONTROLO DE STOCK SEGURO CONTRA CONDIÇÕES DE CORRIDA
-- ====================================================================
-- Este script melhora o trigger de stock original para validar se existe
-- stock suficiente antes de efetuar a redução. Se não houver, levanta
-- uma exceção (erro) e faz ROLLBACK automático do pedido, prevenindo
-- vendas duplicadas ou entregas impossíveis.

CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    order_item RECORD;
    v_stock_quantity INTEGER;
    v_track_stock BOOLEAN;
    v_name TEXT;
    v_requested_qty INTEGER;
BEGIN
    -- NEW.items é um JSONB array contendo os pratos comprados: [{"id": "...", "quantity": 1, "name": "..."}]
    FOR order_item IN SELECT value FROM jsonb_array_elements(NEW.items)
    LOOP
        v_requested_qty := (order_item.value->>'quantity')::integer;
        
        -- Buscar stock atual, flag de controlo e nome do prato na tabela 'menu_items'
        SELECT stock_quantity, track_stock, name 
        INTO v_stock_quantity, v_track_stock, v_name
        FROM public.menu_items 
        WHERE id = (order_item.value->>'id')::uuid;

        -- Validar se o prato está sob controlo de stock
        IF v_track_stock = true THEN
            -- Se a quantidade solicitada for maior que o stock atual
            IF v_stock_quantity < v_requested_qty THEN
                RAISE EXCEPTION 'Não há stock suficiente para o prato "%". Disponível: %, Solicitado: %.', 
                    v_name, 
                    COALESCE(v_stock_quantity, 0), 
                    v_requested_qty;
            ELSE
                -- Decrementar stock com segurança (apenas a quantidade comprada)
                UPDATE public.menu_items 
                SET stock_quantity = stock_quantity - v_requested_qty
                WHERE id = (order_item.value->>'id')::uuid;
            END IF;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-vincular o trigger atualizado à tabela orders
DROP TRIGGER IF EXISTS tr_decrement_stock ON public.orders;
CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order();

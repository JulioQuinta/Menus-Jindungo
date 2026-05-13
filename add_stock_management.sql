-- 1. Adicionar colunas de stock à tabela menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT false;

-- 2. Criar função para decrementar stock automaticamente
-- Esta função será executada por um trigger sempre que um novo pedido (order) for inserido.
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    order_item RECORD;
BEGIN
    -- NEW.items é um JSONB array: [{"id": "...", "quantity": 1, ...}]
    FOR order_item IN SELECT value FROM jsonb_array_elements(NEW.items)
    LOOP
        -- Atualiza apenas se track_stock for verdadeiro
        UPDATE menu_items 
        SET stock_quantity = GREATEST(0, stock_quantity - (order_item.value->>'quantity')::integer)
        WHERE id = (order_item.value->>'id')::uuid 
        AND track_stock = true;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar o Trigger
DROP TRIGGER IF EXISTS tr_decrement_stock ON orders;
CREATE TRIGGER tr_decrement_stock
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order();

-- 4. Notificação de sucesso (opcional para logs do PG)
COMMENT ON COLUMN menu_items.stock_quantity IS 'Quantidade atual em stock';
COMMENT ON COLUMN menu_items.track_stock IS 'Se verdadeiro, o stock será decrementado automaticamente nos pedidos';

-- Reorder Categories to put Sobremesas First

DO $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo-restaurant' LIMIT 1;
    
    IF v_restaurant_id IS NOT NULL THEN
        -- 1. Set Sobremesas to 0 (First)
        UPDATE categories 
        SET sort_order = 0, position = 0
        WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas';

        -- 2. Ensure others follow naturally (Entradas=1, Pratos=2, Bebidas=3)
        -- Just in case they were different, let's explicit set them to be sure
        
        UPDATE categories SET sort_order = 1, position = 1 WHERE restaurant_id = v_restaurant_id AND label = 'Entradas';
        UPDATE categories SET sort_order = 2, position = 2 WHERE restaurant_id = v_restaurant_id AND label = 'Pratos Principais';
        UPDATE categories SET sort_order = 3, position = 3 WHERE restaurant_id = v_restaurant_id AND label = 'Bebidas';

    END IF;
END $$;

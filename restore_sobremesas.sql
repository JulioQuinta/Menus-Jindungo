-- Restore Sobremesas Category
DO $$
DECLARE
    v_restaurant_id UUID;
    v_category_id UUID;
BEGIN
    -- 1. Get the Demo Restaurant ID
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo' LIMIT 1;

    -- 2. Check if Sobremesas exists
    IF NOT EXISTS (SELECT 1 FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas') THEN
        -- Insert it
        INSERT INTO categories (restaurant_id, label, sort_order)
        VALUES (v_restaurant_id, 'Sobremesas', 4) -- Adjust sort order as needed
        RETURNING id INTO v_category_id;
        
        RAISE NOTICE 'Restored Sobremesas Category: %', v_category_id;
    ELSE
        SELECT id INTO v_category_id FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas';
        RAISE NOTICE 'Sobremesas Category already exists: %', v_category_id;
    END IF;

    -- 3. Ensure we have at least one item in it (Petit Gâteau) to make it visible if there's hiding logic
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_category_id) THEN
        INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, available, is_highlight)
        VALUES (
            v_restaurant_id, 
            v_category_id, 
            'Petit Gâteau', 
            '4500', 
            'Bolo de chocolate quente com bola de gelado de baunilha.', 
            'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&auto=format&fit=crop',
            true,
            true
        );
        RAISE NOTICE 'Restored Petit Gâteau item';
    END IF;

END $$;

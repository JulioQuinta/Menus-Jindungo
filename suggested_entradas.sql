-- PROPOSAL: Populate Entradas with "Sopas" and "Petiscos"
-- This script adds new items and ensures 'Entradas' has meaningful subcategories.

DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_entradas_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo-restaurant' LIMIT 1;
    SELECT id INTO v_cat_entradas_id FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Entradas' LIMIT 1;

    IF v_restaurant_id IS NOT NULL AND v_cat_entradas_id IS NOT NULL THEN
        
        -- 1. Add "Sopas"
        INSERT INTO menu_items (restaurant_id, category_id, name, desc_text, price, img_url, available, is_highlight, subcategory)
        VALUES 
        (v_restaurant_id, v_cat_entradas_id, 'Sopa de Peixe', 'Rica sopa tradicional com peixe fresco e coentros.', 2500, 'https://images.unsplash.com/photo-1594756202469-9ff9799bef7a?auto=format&fit=crop&w=500&q=80', true, true, 'Sopas'),
        (v_restaurant_id, v_cat_entradas_id, 'Caldo Verde', 'Sopa típica com chouriço e couve galega.', 2000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=80', true, false, 'Sopas');

        -- 2. Add "Petiscos"
        INSERT INTO menu_items (restaurant_id, category_id, name, desc_text, price, img_url, available, is_highlight, subcategory)
        VALUES 
        (v_restaurant_id, v_cat_entradas_id, 'Choco Frito', 'Tiras de choco panado com limão.', 4000, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=500&q=80', true, true, 'Petiscos'),
        (v_restaurant_id, v_cat_entradas_id, 'Moelas Estufadas', 'Moelas tenras em molho de tomate picante.', 3500, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80', true, false, 'Petiscos');

        -- 3. Update existing Camarão/Chamuças to 'Petiscos' if they exist
        UPDATE menu_items SET subcategory = 'Petiscos' 
        WHERE category_id = v_cat_entradas_id AND (name ILIKE '%Camarão%' OR name ILIKE '%Chamuças%');

    END IF;
END $$;

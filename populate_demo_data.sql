-- POPULATE DEMO RESTAURANT WITH DATA

DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_entradas_id UUID;
    v_cat_pratos_id UUID;
    v_cat_bebidas_id UUID;
BEGIN
    -- 1. Get the Demo Restaurant ID
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo-restaurant' LIMIT 1;

    -- If not found, exit (should have been created by previous script)
    IF v_restaurant_id IS NULL THEN
        RAISE NOTICE 'Demo restaurant not found. Please run fix_public_access.sql first.';
        RETURN;
    END IF;

    -- 2. Create Categories
    INSERT INTO categories (restaurant_id, label, sort_order)
    VALUES (v_restaurant_id, 'Entradas', 1)
    RETURNING id INTO v_cat_entradas_id;

    INSERT INTO categories (restaurant_id, label, sort_order)
    VALUES (v_restaurant_id, 'Pratos Principais', 2)
    RETURNING id INTO v_cat_pratos_id;

    INSERT INTO categories (restaurant_id, label, sort_order)
    VALUES (v_restaurant_id, 'Bebidas', 3)
    RETURNING id INTO v_cat_bebidas_id;

    -- 3. Create Menu Items

    -- Entradas
    INSERT INTO menu_items (restaurant_id, category_id, name, desc_text, price, img_url, available, is_highlight)
    VALUES 
    (v_restaurant_id, v_cat_entradas_id, 'Camarão ao Alho', 'Camarões salteados com alho e ervas finas.', 4500, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80', true, true),
    (v_restaurant_id, v_cat_entradas_id, 'Chamuças de Carne', 'Deliciosas chamuças recheadas com carne picada.', 500, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80', true, false);

    -- Pratos Principais
    INSERT INTO menu_items (restaurant_id, category_id, name, desc_text, price, img_url, available, is_highlight)
    VALUES 
    (v_restaurant_id, v_cat_pratos_id, 'Bife à Portuguesa', 'Bife da vazia com molho de natas e batatas fritas.', 8500, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500&q=80', true, true),
    (v_restaurant_id, v_cat_pratos_id, 'Bacalhau com Natas', 'Clássico bacalhau desfiado gratinado com natas.', 9000, 'https://images.unsplash.com/photo-1576021182211-9a2e5772643a?auto=format&fit=crop&w=500&q=80', true, false);

    -- Bebidas
    INSERT INTO menu_items (restaurant_id, category_id, name, desc_text, price, img_url, available, is_highlight)
    VALUES 
    (v_restaurant_id, v_cat_bebidas_id, 'Coca-Cola', 'Lata 330ml', 800, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80', true, false),
    (v_restaurant_id, v_cat_bebidas_id, 'Cuca', 'Cerveja nacional', 700, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=500&q=80', true, false);

END $$;

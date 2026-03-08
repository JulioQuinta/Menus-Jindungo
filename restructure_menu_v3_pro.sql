
-- MENU JINDUNGO PRO (VERSÃO 3.1 - FIX)
-- Correção do erro de "constraint" substituindo ON CONFLICT por IF/ELSE explícitos.

DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_chef UUID;
    v_cat_comecar UUID;
    v_cat_leveza UUID;
    v_cat_prato UUID;
    v_cat_extra UUID;
    v_cat_sobremesa UUID;
    v_cat_bebida UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo' LIMIT 1;
    
    ---------------------------------------------------------------------------
    -- 1. CRIAR / ATUALIZAR CATEGORIAS (Via SELECT/INSERT Safe)
    ---------------------------------------------------------------------------
    RAISE NOTICE 'Criando nova estrutura de abas...';

    -- 1. Sugestões do Chef
    SELECT id INTO v_cat_chef FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sugestões do Chef';
    IF v_cat_chef IS NULL THEN
        INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Sugestões do Chef', 1) RETURNING id INTO v_cat_chef;
    ELSE
        UPDATE categories SET sort_order = 1 WHERE id = v_cat_chef;
    END IF;

    -- 2. Para Começar (Era Entradas)
    SELECT id INTO v_cat_comecar FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Para Começar';
    IF v_cat_comecar IS NULL THEN
        -- Tenta ver se existe como 'Entradas' antes de criar um novo
        SELECT id INTO v_cat_comecar FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Entradas';
        IF v_cat_comecar IS NOT NULL THEN
            UPDATE categories SET label = 'Para Começar', sort_order = 2 WHERE id = v_cat_comecar;
        ELSE
            INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Para Começar', 2) RETURNING id INTO v_cat_comecar;
        END IF;
    ELSE
         UPDATE categories SET sort_order = 2 WHERE id = v_cat_comecar;
    END IF;

    -- 3. Leveza & Frescura
    SELECT id INTO v_cat_leveza FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Leveza & Frescura';
    IF v_cat_leveza IS NULL THEN
        INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Leveza & Frescura', 3) RETURNING id INTO v_cat_leveza;
    ELSE
        UPDATE categories SET sort_order = 3 WHERE id = v_cat_leveza;
    END IF;

    -- 4. Prato Principal (Era Pratos Principais)
    SELECT id INTO v_cat_prato FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Prato Principal';
    IF v_cat_prato IS NULL THEN
         -- Tenta ver se existe 'Pratos Principais'
        SELECT id INTO v_cat_prato FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Pratos Principais';
        IF v_cat_prato IS NOT NULL THEN
            UPDATE categories SET label = 'Prato Principal', sort_order = 4 WHERE id = v_cat_prato;
        ELSE
            INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Prato Principal', 4) RETURNING id INTO v_cat_prato;
        END IF;
    ELSE
        UPDATE categories SET sort_order = 4 WHERE id = v_cat_prato;
    END IF;

    -- 5. Acompanhamentos Extra
    SELECT id INTO v_cat_extra FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Acompanhamentos Extra';
    IF v_cat_extra IS NULL THEN
        INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Acompanhamentos Extra', 5) RETURNING id INTO v_cat_extra;
    ELSE
        UPDATE categories SET sort_order = 5 WHERE id = v_cat_extra;
    END IF;

    -- 6. Sobremesas
    SELECT id INTO v_cat_sobremesa FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas';
    IF v_cat_sobremesa IS NULL THEN
        INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Sobremesas', 6) RETURNING id INTO v_cat_sobremesa;
    ELSE
        UPDATE categories SET sort_order = 6 WHERE id = v_cat_sobremesa;
    END IF;

    -- 7. Bebidas & Garrafeira
    SELECT id INTO v_cat_bebida FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Bebidas & Garrafeira';
    IF v_cat_bebida IS NULL THEN
        -- Tenta ver se existe 'Bebidas'
        SELECT id INTO v_cat_bebida FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Bebidas';
        IF v_cat_bebida IS NOT NULL THEN
            UPDATE categories SET label = 'Bebidas & Garrafeira', sort_order = 7 WHERE id = v_cat_bebida;
        ELSE
            INSERT INTO categories (restaurant_id, label, sort_order) VALUES (v_restaurant_id, 'Bebidas & Garrafeira', 7) RETURNING id INTO v_cat_bebida;
        END IF;
    ELSE
        UPDATE categories SET sort_order = 7 WHERE id = v_cat_bebida;
    END IF;


    ---------------------------------------------------------------------------
    -- 2. MIGRAR & ORGANIZAR ITENS (Igual ao anterior)
    ---------------------------------------------------------------------------
    RAISE NOTICE 'Organizando itens nas novas abas...';

    -- === 1. Sugestões do Chef ===
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_chef) THEN
        INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, subcategory, is_highlight)
        VALUES (v_restaurant_id, v_cat_chef, 'Bife à Jindungo (Especial)', 12000, 'O nosso prato assinatura com molho secreto.', 'https://images.unsplash.com/photo-1600891965050-65c9c6f5d2d4', 'Mais Pedidos', true);
    END IF;

    -- === 2. Para Começar ===
    UPDATE menu_items SET subcategory = 'Sopas & Cremes' WHERE category_id = v_cat_comecar AND (name ILIKE '%Sopa%' OR name ILIKE '%Creme%' OR name ILIKE '%Caldo%');
    UPDATE menu_items SET subcategory = 'Entradas Frias' WHERE category_id = v_cat_comecar AND (name ILIKE '%Salada%' OR name ILIKE '%Carpaccio%' OR name ILIKE '%Tártaro%' OR name ILIKE '%Queijo%') AND subcategory != 'Sopas & Cremes';
    UPDATE menu_items SET subcategory = 'Entradas Quentes' WHERE category_id = v_cat_comecar AND (subcategory IS NULL OR subcategory NOT IN ('Sopas & Cremes', 'Entradas Frias'));

    -- === 3. Leveza & Frescura ===
    UPDATE menu_items SET category_id = v_cat_leveza, subcategory = 'Saladas de Proteína' WHERE category_id = v_cat_comecar AND (name ILIKE '%Salada Cesar%' OR name ILIKE '%Salada de Frango%' OR name ILIKE '%Salada de Atum%');
    UPDATE menu_items SET category_id = v_cat_leveza, subcategory = 'Saladas Veganas' WHERE category_id = v_cat_comecar AND (name ILIKE '%Salada Verde%' OR name ILIKE '%Salada Mista%');

    -- === 4. Prato Principal ===
    UPDATE menu_items SET subcategory = 'Carnes' WHERE category_id = v_cat_prato AND (name ILIKE '%Bife%' OR name ILIKE '%Picanha%' OR name ILIKE '%Lombo%' OR name ILIKE '%Frango%' OR name ILIKE '%Pato%' OR name ILIKE '%Chouriço%' OR name ILIKE '%Hambúrguer%' OR subcategory = 'Com Carne');
    UPDATE menu_items SET subcategory = 'Do Mar' WHERE category_id = v_cat_prato AND (name ILIKE '%Bacalhau%' OR name ILIKE '%Peixe%' OR name ILIKE '%Polvo%' OR name ILIKE '%Gambas%' OR name ILIKE '%Camarão%' OR name ILIKE '%Lagosta%' OR name ILIKE '%Lula%' OR name ILIKE '%Salmão%' OR subcategory = 'Peixe');
    UPDATE menu_items SET subcategory = 'Vegetariano' WHERE category_id = v_cat_prato AND (name ILIKE '%Vegetariano%' OR name ILIKE '%Legumes%' OR name ILIKE '%Tofu%' OR name ILIKE '%Seitan%' OR name ILIKE '%Risotto de Cogumelos%');

    -- === 5. Acompanhamentos Extra ===
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_cat_extra) THEN
        INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, subcategory) VALUES 
        (v_restaurant_id, v_cat_extra, 'Funge de Mandioca', 2000, 'Porção extra.', 'https://images.unsplash.com/photo-1596560548464-f010549b8416', 'Tradicional'),
        (v_restaurant_id, v_cat_extra, 'Batata Frita', 1500, 'Estaladiças.', 'https://images.unsplash.com/photo-1630384060421-cb20d0e06497', 'Guarnições'),
        (v_restaurant_id, v_cat_extra, 'Arroz de Feijão', 2000, 'Com óleo de palma.', 'https://images.unsplash.com/photo-1596560548464-f010549b8416', 'Guarnições');
    END IF;

    -- === 6. Sobremesas ===
    UPDATE menu_items SET subcategory = 'Doces Tradicionais' WHERE category_id = v_cat_sobremesa AND (name ILIKE '%Bolo%' OR name ILIKE '%Pudim%' OR name ILIKE '%Mousse%' OR name ILIKE '%Petit%');
    UPDATE menu_items SET subcategory = 'Frutas da Época' WHERE category_id = v_cat_sobremesa AND (name ILIKE '%Fruta%' OR name ILIKE '%Salada de Fruta%' OR name ILIKE '%Abacaxi%');
    UPDATE menu_items SET subcategory = 'Gelados' WHERE category_id = v_cat_sobremesa AND (name ILIKE '%Gelado%' OR name ILIKE '%Sorvete%');

    -- === 7. Bebidas & Garrafeira ===
    UPDATE menu_items SET subcategory = 'Sumos Naturais & Softs' WHERE category_id = v_cat_bebida AND (name ILIKE '%Sumo%' OR name ILIKE '%Cola%' OR name ILIKE '%Água%' OR name ILIKE '%Sprite%' OR name ILIKE '%Fanta%' OR subcategory = 'Sem Álcool');
    UPDATE menu_items SET subcategory = 'Cervejas & Cocktails' WHERE category_id = v_cat_bebida AND (name ILIKE '%Cerveja%' OR name ILIKE '%Fino%' OR name ILIKE '%Caipirinha%' OR name ILIKE '%Mojito%' OR name ILIKE '%Daiquiri%' OR name ILIKE '%Gin%');
    UPDATE menu_items SET subcategory = 'Vinhos & Espirituosas' WHERE category_id = v_cat_bebida AND (name ILIKE '%Vinho%' OR name ILIKE '%Whisky%' OR name ILIKE '%Licor%' OR name ILIKE '%Conhaque%' OR name ILIKE '%Rum%' OR subcategory = 'Com Álcool');
    
    RAISE NOTICE 'Menu Jindungo Pro V3 Aplicado com Sucesso!';
END $$;

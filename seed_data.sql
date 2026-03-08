-- Substitua o ID abaixo pelo ID do seu restaurante se for diferente
DO $$
DECLARE
    r_id UUID := '3ce7dba3-cb69-4fd6-bb22-ff371199bad7';
    cat_entradas UUID;
    cat_pratos UUID;
    cat_bebidas UUID;
BEGIN
    -- 1. Inserir Categorias
    INSERT INTO categories (restaurant_id, label, sort_order) VALUES (r_id, 'Entradas', 1) RETURNING id INTO cat_entradas;
    INSERT INTO categories (restaurant_id, label, sort_order) VALUES (r_id, 'Pratos Principais', 2) RETURNING id INTO cat_pratos;
    INSERT INTO categories (restaurant_id, label, sort_order) VALUES (r_id, 'Bebidas', 3) RETURNING id INTO cat_bebidas;

    -- 2. Inserir Itens - Entradas
    INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, is_highlight, badge)
    VALUES (r_id, cat_entradas, 'Tartare de Atum', '18.000 Kz', 'Atum fresco com abacate e molho ponzu.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true, 'Novo');
    
    INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, badge)
    VALUES (r_id, cat_entradas, 'Camarão ao Alho', '15.000 Kz', 'Salteado com alho, coentros e piri-piri.', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 'Picante');

    -- 3. Inserir Itens - Pratos
    INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, is_highlight, badge, pairs_with)
    VALUES (r_id, cat_pratos, 'Hambúrguer Wagyu', '24.000 Kz', 'Carne premium, queijo cheddar e trufas.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true, 'Best Seller', 'Fino (Imperial)');

    INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, badge)
    VALUES (r_id, cat_pratos, 'Bitoque da Casa', '16.000 Kz', 'Bife da vazia com ovo a cavalo.', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400', 'Promoção');

    -- 4. Inserir Itens - Bebidas
    INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, img_url, is_highlight)
    VALUES (r_id, cat_bebidas, 'Limonada de Coco', '4.000 Kz', 'Refrescante e cremosa.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', true);

END $$;

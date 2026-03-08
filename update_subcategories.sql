
-- ATUALIZAÇÃO DE SUBCATEGORIAS (Bebidas & Pratos)

DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_bebidas UUID;
    v_cat_pratos UUID;
BEGIN
    -- 1. Obter ID do Restaurante Demo
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo' LIMIT 1;
    
    -- 2. Obter IDs das Categorias Principais
    SELECT id INTO v_cat_bebidas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Bebidas';
    SELECT id INTO v_cat_pratos FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Pratos Principais';

    ---------------------------------------------------
    -- BEBIDAS: Dividir em "Com Álcool" e "Sem Álcool"
    ---------------------------------------------------
    IF v_cat_bebidas IS NOT NULL THEN
        RAISE NOTICE 'Atualizando Bebidas...';
        
        -- Atualizar para "Com Álcool" (Cervejas, Vinhos, Gin, etc)
        UPDATE menu_items 
        SET subcategory = 'Com Álcool' 
        WHERE category_id = v_cat_bebidas 
        AND (
            name ILIKE '%Vinho%' OR 
            name ILIKE '%Cerveja%' OR 
            name ILIKE '%Gin%' OR 
            name ILIKE '%Whisky%' OR 
            name ILIKE '%Caipirinha%' OR
            name ILIKE '%Licor%'
        );

        -- Atualizar todos os outros para "Sem Álcool" (se ainda estiver nulo)
        UPDATE menu_items 
        SET subcategory = 'Sem Álcool' 
        WHERE category_id = v_cat_bebidas 
        AND subcategory IS NULL;
        
        -- Forçar alguns conhecidos se necessário
        UPDATE menu_items SET subcategory = 'Sem Álcool' WHERE category_id = v_cat_bebidas AND (name ILIKE '%Coca%' OR name ILIKE '%Sumo%' OR name ILIKE '%Água%');
        
    END IF;

    ---------------------------------------------------
    -- PRATOS PRINCIPAIS: Dividir em "Carne" e "Peixe"
    ---------------------------------------------------
    IF v_cat_pratos IS NOT NULL THEN
        RAISE NOTICE 'Atualizando Pratos...';

        -- Atualizar para "Peixe" (Bacalhau, Atum, Polvo, Gambas, etc)
        UPDATE menu_items 
        SET subcategory = 'Peixe' 
        WHERE category_id = v_cat_pratos 
        AND (
            name ILIKE '%Bacalhau%' OR 
            name ILIKE '%Peixe%' OR 
            name ILIKE '%Atum%' OR 
            name ILIKE '%Polvo%' OR 
            name ILIKE '%Gambas%' OR 
            name ILIKE '%Camarão%' OR
            name ILIKE '%Lagosta%' OR
            desc_text ILIKE '%Peixe%' OR
            desc_text ILIKE '%Marisco%'
        );

        -- Atualizar para "Carne" (Bife, Picanha, Frango, Cabrito, etc)
        UPDATE menu_items 
        SET subcategory = 'Carne' 
        WHERE category_id = v_cat_pratos 
        AND (
            name ILIKE '%Bife%' OR 
            name ILIKE '%Carne%' OR 
            name ILIKE '%Picanha%' OR 
            name ILIKE '%Frango%' OR 
            name ILIKE '%Cabrito%' OR 
            name ILIKE '%Porco%' OR
            name ILIKE '%Hambúrguer%' OR
            desc_text ILIKE '%Carne%'
        );

        -- Se sobrar algum sem categoria nos Pratos, definir como "Outros" ou "Vegetariano" se aplicável, ou 'Carne' por defeito
        -- UPDATE menu_items SET subcategory = 'Carne' WHERE category_id = v_cat_pratos AND subcategory IS NULL;
    END IF;

    RAISE NOTICE 'Atualização Concluída!';

END $$;

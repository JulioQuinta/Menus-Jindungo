
-- REORGANIZAÇÃO DO MENU (V2)
-- 1. Reordenar Abas
-- 2. Atualizar Subcategorias (Com/Sem Carne, Com/Sem Álcool)

DO $$
DECLARE
    v_restaurant_id UUID;
    v_cat_entradas UUID;
    v_cat_sobremesas UUID;
    v_cat_pratos UUID;
    v_cat_bebidas UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo' LIMIT 1;
    
    -- Obter IDs
    SELECT id INTO v_cat_entradas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Entradas';
    SELECT id INTO v_cat_sobremesas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas';
    SELECT id INTO v_cat_pratos FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Pratos Principais';
    SELECT id INTO v_cat_bebidas FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Bebidas';

    ---------------------------------------------------
    -- 1. ORDENAÇÃO DAS ABAS
    ---------------------------------------------------
    -- Ordem pedida: 1. Entradas, 2. Sobremesas, 3. Prato Principal, 4. Bebidas
    RAISE NOTICE 'Reordenando Abas...';
    
    IF v_cat_entradas IS NOT NULL THEN
        UPDATE categories SET sort_order = 1 WHERE id = v_cat_entradas;
    END IF;

    IF v_cat_sobremesas IS NOT NULL THEN
        UPDATE categories SET sort_order = 2 WHERE id = v_cat_sobremesas;
    END IF;

    IF v_cat_pratos IS NOT NULL THEN
        UPDATE categories SET sort_order = 3 WHERE id = v_cat_pratos;
    END IF;

    IF v_cat_bebidas IS NOT NULL THEN
        UPDATE categories SET sort_order = 4 WHERE id = v_cat_bebidas;
    END IF;

    ---------------------------------------------------
    -- 2. SUBCATEGORIAS: BEBIDAS (Com Álcool / Sem Álcool)
    ---------------------------------------------------
    IF v_cat_bebidas IS NOT NULL THEN
        RAISE NOTICE 'Atualizando Bebidas...';
        -- Garantir normalização
        UPDATE menu_items SET subcategory = 'Com Álcool' 
        WHERE category_id = v_cat_bebidas 
        AND (name ILIKE '%Vinho%' OR name ILIKE '%Cerveja%' OR name ILIKE '%Gin%' OR name ILIKE '%Whisky%' OR name ILIKE '%Licor%' OR name ILIKE '%Caipirinha%');

        UPDATE menu_items SET subcategory = 'Sem Álcool' 
        WHERE category_id = v_cat_bebidas 
        AND (subcategory IS NULL OR subcategory NOT IN ('Com Álcool'));
    END IF;

    ---------------------------------------------------
    -- 3. SUBCATEGORIAS: PRATOS (Com Carne / Sem Carne)
    ---------------------------------------------------
    IF v_cat_pratos IS NOT NULL THEN
        RAISE NOTICE 'Atualizando Pratos...';
        
        -- Resetar para garantir limpeza
        -- UPDATE menu_items SET subcategory = NULL WHERE category_id = v_cat_pratos;

        -- Com Carne
        UPDATE menu_items SET subcategory = 'Com Carne' 
        WHERE category_id = v_cat_pratos 
        AND (
            name ILIKE '%Bife%' OR name ILIKE '%Carne%' OR name ILIKE '%Picanha%' OR 
            name ILIKE '%Frango%' OR name ILIKE '%Cabrito%' OR name ILIKE '%Porco%' OR 
            name ILIKE '%Hambúrguer%' OR name ILIKE '%Chouriço%' OR
            desc_text ILIKE '%Carne%' OR desc_text ILIKE '%Frango%'
        );

        -- Sem Carne (Peixe, Marisco, Vegetariano)
        UPDATE menu_items SET subcategory = 'Sem Carne' 
        WHERE category_id = v_cat_pratos 
        AND (
            name ILIKE '%Bacalhau%' OR name ILIKE '%Peixe%' OR name ILIKE '%Atum%' OR 
            name ILIKE '%Polvo%' OR name ILIKE '%Gambas%' OR name ILIKE '%Camarão%' OR 
            name ILIKE '%Lagosta%' OR name ILIKE '%Lula%' OR name ILIKE '%Vegetariano%' OR
            desc_text ILIKE '%Peixe%' OR desc_text ILIKE '%Marisco%'
        );
        
        -- Fallback: Se sobrou algo anterior como 'Peixe' ou 'Carne' antigo, converter
        UPDATE menu_items SET subcategory = 'Com Carne' WHERE category_id = v_cat_pratos AND subcategory = 'Carne';
        UPDATE menu_items SET subcategory = 'Sem Carne' WHERE category_id = v_cat_pratos AND subcategory = 'Peixe';

    END IF;

    RAISE NOTICE 'Menu Reorganizado com Sucesso!';

END $$;

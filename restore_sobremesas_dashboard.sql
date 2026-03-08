
-- TENTATIVA DE RECUPERAR A CATEGORIA SOBREMESAS

DO $$
DECLARE
    v_restaurant_id UUID;
    v_category_id UUID;
BEGIN
    -- 1. Obter o ID do Restaurante Demo
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo' LIMIT 1;
    
    -- Se não encontrar, tenta criar um dummy (mas deve encontrar)
    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Restaurante Demo não encontrado!';
    END IF;

    -- 2. Verificar se a Categoria Sobremesas existe
    SELECT id INTO v_category_id FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas';

    IF v_category_id IS NULL THEN
        -- Criar a Categoria
        INSERT INTO categories (restaurant_id, label, sort_order)
        VALUES (v_restaurant_id, 'Sobremesas', 4)
        RETURNING id INTO v_category_id;
        
        RAISE NOTICE 'Categoria Sobremesas criada com ID: %', v_category_id;
    ELSE
        RAISE NOTICE 'Categoria Sobremesas já existe com ID: %', v_category_id;
    END IF;

    -- 3. Inserir Item (Petit Gâteau) se a categoria estiver vazia
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE category_id = v_category_id) THEN
        INSERT INTO menu_items (
            restaurant_id, 
            category_id, 
            name, 
            price, 
            desc_text, 
            img_url, 
            available, 
            is_highlight
        )
        VALUES (
            v_restaurant_id, 
            v_category_id, 
            'Petit Gâteau', 
            4500, 
            'Bolo de chocolate quente com bola de gelado de baunilha.', 
            'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&auto=format&fit=crop',
            true,
            true
        );
        RAISE NOTICE 'Item Petit Gâteau inserido com sucesso!';
    ELSE
        RAISE NOTICE 'A categoria já tem itens.';
    END IF;

END $$;

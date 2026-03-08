
-- ADICIONAR COLUNA DE SUBCATEGORIAS & MIGRAR DADOS EXISTENTES

DO $$
BEGIN
    -- 1. Adicionar coluna se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'subcategories') THEN
        ALTER TABLE categories ADD COLUMN subcategories TEXT[] DEFAULT '{}';
    END IF;

    -- 2. Migrar dados do Menu Pro V3 (Preencher subcategorias padrão)
    -- Para Começar
    UPDATE categories SET subcategories = ARRAY['Sopas & Cremes', 'Entradas Frias', 'Entradas Quentes'] 
    WHERE label = 'Para Começar' OR label = 'Entradas';

    -- Leveza & Frescura
    UPDATE categories SET subcategories = ARRAY['Saladas de Proteína', 'Saladas Veganas'] 
    WHERE label = 'Leveza & Frescura';

    -- Prato Principal
    UPDATE categories SET subcategories = ARRAY['Carnes', 'Do Mar', 'Vegetariano'] 
    WHERE label = 'Prato Principal' OR label = 'Pratos Principais';

    -- Acompanhamentos Extra
    UPDATE categories SET subcategories = ARRAY['Tradicional', 'Guarnições'] 
    WHERE label = 'Acompanhamentos Extra';

    -- Sobremesas
    UPDATE categories SET subcategories = ARRAY['Doces Tradicionais', 'Frutas da Época', 'Gelados'] 
    WHERE label = 'Sobremesas';

    -- Bebidas & Garrafeira
    UPDATE categories SET subcategories = ARRAY['Sumos Naturais & Softs', 'Cervejas & Cocktails', 'Vinhos & Espirituosas'] 
    WHERE label = 'Bebidas & Garrafeira' OR label = 'Bebidas';

    RAISE NOTICE 'Coluna subcategories adicionada e defaults configurados!';
END $$;

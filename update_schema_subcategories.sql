-- 1. Add subcategory column if not exists
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 2. Update existing items (Examples based on typical data)
-- Bebidas
UPDATE menu_items SET subcategory = 'Sem Álcool' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Bebidas') AND name ILIKE '%Coca%';
UPDATE menu_items SET subcategory = 'Sem Álcool' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Bebidas') AND name ILIKE '%Água%';
UPDATE menu_items SET subcategory = 'Com Álcool' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Bebidas') AND name ILIKE '%Cerveja%';
UPDATE menu_items SET subcategory = 'Com Álcool' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Bebidas') AND name ILIKE '%Vinho%';
UPDATE menu_items SET subcategory = 'Com Álcool' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Bebidas') AND name ILIKE '%Cuca%';

-- Pratos Principais
UPDATE menu_items SET subcategory = 'Carne' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Pratos Principais') AND name ILIKE '%Bife%';
UPDATE menu_items SET subcategory = 'Carne' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Pratos Principais') AND name ILIKE '%Frango%';
UPDATE menu_items SET subcategory = 'Carne' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Pratos Principais') AND name ILIKE '%Carne%';
UPDATE menu_items SET subcategory = 'Peixe' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Pratos Principais') AND name ILIKE '%Bacalhau%';
UPDATE menu_items SET subcategory = 'Peixe' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Pratos Principais') AND name ILIKE '%Peixe%';
UPDATE menu_items SET subcategory = 'Peixe' WHERE category_id IN (SELECT id FROM categories WHERE label = 'Pratos Principais') AND name ILIKE '%Camarão%';

-- 3. Ensure 'Sobremesas' category exists
DO $$
DECLARE
    v_restaurant_id UUID;
BEGIN
    SELECT id INTO v_restaurant_id FROM restaurants WHERE slug = 'demo-restaurant' LIMIT 1;
    
    IF v_restaurant_id IS NOT NULL THEN
        INSERT INTO categories (restaurant_id, label, sort_order)
        SELECT v_restaurant_id, 'Sobremesas', 4
        WHERE NOT EXISTS (
            SELECT 1 FROM categories WHERE restaurant_id = v_restaurant_id AND label = 'Sobremesas'
        );
    END IF;
END $$;

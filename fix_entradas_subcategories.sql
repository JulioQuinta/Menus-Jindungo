-- Clear subcategories for Entradas to remove the tabs
UPDATE menu_items 
SET subcategory = NULL 
WHERE category_id IN (
    SELECT id FROM categories WHERE label = 'Entradas'
);

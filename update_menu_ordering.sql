-- Add position column to categories and menu_items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'position') THEN
        ALTER TABLE categories ADD COLUMN position INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'position') THEN
        ALTER TABLE menu_items ADD COLUMN position INTEGER;
    END IF;
END $$;

-- Optional: Initialize position based on creation date for existing items
-- This prevents null values which might break sorting logic
WITH indexed_categories AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY created_at) - 1 as new_pos
    FROM categories
    WHERE position IS NULL
)
UPDATE categories
SET position = indexed_categories.new_pos
FROM indexed_categories
WHERE categories.id = indexed_categories.id;

WITH indexed_items AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 as new_pos
    FROM menu_items
    WHERE position IS NULL
)
UPDATE menu_items
SET position = indexed_items.new_pos
FROM indexed_items
WHERE menu_items.id = indexed_items.id;


-- 1. Ensure Columns (Update schema if needed)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 2. Upsert Categories
-- Entradas
INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
SELECT id, 'Entradas', 1, ARRAY['Quentes', 'Frias', 'Petiscos'] FROM restaurants WHERE slug = 'demo' OR slug = 'demo-restaurant' LIMIT 1;
-- Note: ON CONFLICT might fail if constraint is missing, so we rely on duplicates being acceptable or constraint existing. 
-- Wait, if no unique constraint on (restaurant_id, label), we might duplicate.
-- But earlier logic assumed duplicates prevented by application logic or previous scripts.
-- To be safe, let's use UPDATE if exists, else INSERT. But standard SQL merge is tricky.
-- We'll assume unique constraint exists or duplicates are fine for now (user just wants examples).

-- UPDATE existing if any
UPDATE categories SET subcategories = ARRAY['Quentes', 'Frias', 'Petiscos'] 
WHERE label = 'Entradas' AND restaurant_id IN (SELECT id FROM restaurants WHERE slug = 'demo' OR slug = 'demo-restaurant');

-- INSERT if not exists
INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
SELECT id, 'Entradas', 1, ARRAY['Quentes', 'Frias', 'Petiscos'] FROM restaurants r
WHERE (slug = 'demo' OR slug = 'demo-restaurant')
AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.restaurant_id = r.id AND c.label = 'Entradas');


-- Pratos Principais
UPDATE categories SET subcategories = ARRAY['Carnes', 'Peixes', 'Vegetariano', 'Massas'] 
WHERE label = 'Pratos Principais' AND restaurant_id IN (SELECT id FROM restaurants WHERE slug = 'demo' OR slug = 'demo-restaurant');

INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
SELECT id, 'Pratos Principais', 2, ARRAY['Carnes', 'Peixes', 'Vegetariano', 'Massas'] FROM restaurants r
WHERE (slug = 'demo' OR slug = 'demo-restaurant')
AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.restaurant_id = r.id AND c.label = 'Pratos Principais');


-- Bebidas
UPDATE categories SET subcategories = ARRAY['Refrigerantes', 'Cervejas', 'Vinhos', 'Cocktails'] 
WHERE label = 'Bebidas' AND restaurant_id IN (SELECT id FROM restaurants WHERE slug = 'demo' OR slug = 'demo-restaurant');

INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
SELECT id, 'Bebidas', 3, ARRAY['Refrigerantes', 'Cervejas', 'Vinhos', 'Cocktails'] FROM restaurants r
WHERE (slug = 'demo' OR slug = 'demo-restaurant')
AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.restaurant_id = r.id AND c.label = 'Bebidas');


-- Sobremesas
UPDATE categories SET subcategories = ARRAY['Doces', 'Frutas', 'Gelados'] 
WHERE label = 'Sobremesas' AND restaurant_id IN (SELECT id FROM restaurants WHERE slug = 'demo' OR slug = 'demo-restaurant');

INSERT INTO categories (restaurant_id, label, sort_order, subcategories)
SELECT id, 'Sobremesas', 4, ARRAY['Doces', 'Frutas', 'Gelados'] FROM restaurants r
WHERE (slug = 'demo' OR slug = 'demo-restaurant')
AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.restaurant_id = r.id AND c.label = 'Sobremesas');


-- 3. Insert Items
-- Entradas
INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Chamuças de Carne (3un)', '1500', 'Crocantes e recheadas com carne temperada à moda da casa.', 'Quentes', true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Entradas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Chamuças de Carne (3un)')
LIMIT 1;

INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Salada Caprese', '3200', 'Tomate fresco, mozzarella de búfala, manjericão e azeite virgem.', 'Frias', true, 'https://images.unsplash.com/photo-1529312266912-b33cf6227e2f?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Entradas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Salada Caprese')
LIMIT 1;


-- Pratos Principais
INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Bitoque da Casa', '5800', 'Bife da vazia grelhado com molho especial, ovo a cavalo, batata frita e arroz.', 'Carnes', true, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Pratos Principais'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Bitoque da Casa')
LIMIT 1;

INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Bacalhau com Natas', '6500', 'Clássico bacalhau desfiado envolvido em natas e batata palha gratinado ao forno.', 'Peixes', true, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcf0?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Pratos Principais'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Bacalhau com Natas')
LIMIT 1;

INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Esparguete à Bolonhesa', '3800', 'Massa italiana com molho de tomate caseiro e carne picada.', 'Massas', true, 'https://images.unsplash.com/photo-1622973536968-3ead9e780568?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Pratos Principais'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Esparguete à Bolonhesa')
LIMIT 1;


-- Bebidas
INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Coca-Cola', '800', 'Lata 330ml gelada.', 'Refrigerantes', true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Bebidas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Coca-Cola')
LIMIT 1;

INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Mojito Clássico', '3000', 'Rum, hortelã fresca, lima, açúcar e soda.', 'Cocktails', true, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Bebidas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Mojito Clássico')
LIMIT 1;

INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Vinho Tinto Casa', '4500', 'Garrafa 750ml, região do Dão.', 'Vinhos', true, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Bebidas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Vinho Tinto Casa')
LIMIT 1;


-- Sobremesas
INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Mousse de Chocolate', '1800', 'Mousse caseira rica e cremosa com raspas de chocolate.', 'Doces', true, 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Sobremesas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Mousse de Chocolate')
LIMIT 1;

INSERT INTO menu_items (restaurant_id, category_id, name, price, desc_text, subcategory, available, img_url)
SELECT r.id, c.id, 'Salada de Fruta', '1200', 'Mix de frutas da época frescas.', 'Frutas', true, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'
FROM restaurants r, categories c
WHERE (r.slug = 'demo' OR r.slug = 'demo-restaurant')
AND c.restaurant_id = r.id AND c.label = 'Sobremesas'
AND NOT EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = r.id AND name = 'Salada de Fruta')
LIMIT 1;

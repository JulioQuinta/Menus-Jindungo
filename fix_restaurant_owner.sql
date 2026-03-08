
-- ATUALIZAR DONO DO RESTAURANTE DEMO
-- O ID do usuário foi obtido do log do console: 160da23b-d6a7-4841-aff1-de0cfb503410

UPDATE restaurants
SET owner_id = '160da23b-d6a7-4841-aff1-de0cfb503410'
WHERE slug = 'demo';

-- Se não existir, criar (fallback de segurança)
INSERT INTO restaurants (name, slug, owner_id, status)
SELECT 'Jindungo Demo', 'demo', '160da23b-d6a7-4841-aff1-de0cfb503410', 'active'
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE slug = 'demo');

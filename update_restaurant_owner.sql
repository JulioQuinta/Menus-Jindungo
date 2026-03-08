
-- FORÇAR ATUALIZAÇÃO DO DONO PARA O USUÁRIO LOGADO
-- ID obtido do painel de debug: 160da23b-d6a7-4841-aff1-de0cfb503410

UPDATE restaurants
SET owner_id = '160da23b-d6a7-4841-aff1-de0cfb503410'
WHERE slug = 'demo';

-- Caso não exista 'demo' (improvável), atualizar o primeiro encontrado
UPDATE restaurants
SET owner_id = '160da23b-d6a7-4841-aff1-de0cfb503410'
WHERE id IN (SELECT id FROM restaurants LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM restaurants WHERE owner_id = '160da23b-d6a7-4841-aff1-de0cfb503410');

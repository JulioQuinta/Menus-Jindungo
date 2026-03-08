
-- HABILITAR RLS NA TABELA RESTAURANTS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- REMOVER POLÍTICAS ANTIGAS SE EXISTIREM (PARA EVITAR DUPLICAÇÃO/ERROS)
DROP POLICY IF EXISTS "Users can view their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can insert their own restaurant" ON restaurants;

-- CRIAR POLÍTICAS
-- 1. Permitir SELECT para o dono
CREATE POLICY "Users can view their own restaurant"
ON restaurants FOR SELECT
USING (auth.uid() = owner_id);

-- 2. Permitir UPDATE para o dono
CREATE POLICY "Users can update their own restaurant"
ON restaurants FOR UPDATE
USING (auth.uid() = owner_id);

-- 3. Permitir INSERT (Opcional, mas útil se o usuário criar novos)
CREATE POLICY "Users can insert their own restaurant"
ON restaurants FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- 4. Permitir PUBLIC READ para slugs (para o menu público funcionar sem logar)
-- Isso é CRÍTICO para /demo funcionar para visitantes
DROP POLICY IF EXISTS "Public can view restaurants by slug" ON restaurants;
CREATE POLICY "Public can view restaurants by slug"
ON restaurants FOR SELECT
USING (true); 
-- Nota: A política acima "true" permite tudo para select. 
-- Se quisermos restringir, seria algo como "auth.role() = 'anon'" mas geralmente "available = true" ou similar.
-- Como é tabela de restaurantes, geralmente é público para leitura de nome/slug/tema.


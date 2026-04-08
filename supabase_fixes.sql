-- SCRIPT DE CORREÇÃO E ESTABILIZAÇÃO DO BANCO DE DADOS JINDUNGO
-- Deve ser executado no painel 'SQL Editor' do Supabase.

-- 1. Promover a conta atual para Administrador (ajuste o email se necessário)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'juliopchquinta@gmail.com';

-- 2. Garantir Acesso Público aos Restaurantes (Menu Público)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.restaurants;
CREATE POLICY "Enable read access for all users" 
ON public.restaurants FOR SELECT 
USING (true);

-- 3. Garantir Acesso Público às Categorias Menu (Para os clientes poderem ver o menu)
DROP POLICY IF EXISTS "Enable read access for public categories" ON public.categories;
CREATE POLICY "Enable read access for public categories" 
ON public.categories FOR SELECT 
USING (true);

-- 4. Garantir Acesso Público aos Itens do Menu
DROP POLICY IF EXISTS "Enable read access for public items" ON public.menu_items;
CREATE POLICY "Enable read access for public items" 
ON public.menu_items FOR SELECT 
USING (true);

-- 5. Garantir que os clientes anónimos possam CRIAR pedidos na tabela Orders
DROP POLICY IF EXISTS "Enable insert access for public orders" ON public.orders;
CREATE POLICY "Enable insert access for public orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- 6. Garantir que clientes anónimos/auths possam atualizar apenas detalhes do seu próprio pedido? (Opcional)
-- Para segurança máxima, a atualização de estados deve ser feita só pelos admins.
-- Os clientes na UI apenas leem via realtime e não fazem UPDATE.

-- Confirmação final no terminal do Supabase:
SELECT 'Configuração RLS e Perfis aplicada com sucesso!' as Success;

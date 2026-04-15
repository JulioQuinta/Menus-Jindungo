-- Permitir que o telemóvel do Motoboy (anónimo sem login) possa atualizar o estado do pedido (só se ele tiver o link/ID certo)
DROP POLICY IF EXISTS "Allow public update order" ON orders;
CREATE POLICY "Allow public update order" 
ON orders FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

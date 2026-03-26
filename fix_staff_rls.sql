-- Atualiza as políticas de RLS (Segurança) para a tabela staff_members
-- Isto permite que Administradores Gerais / SuperAdmins e os próprios donos
-- consigam gravar membros sem terem as suas permissões bloqueadas por "nova linha viola RLS".

DROP POLICY IF EXISTS "Super admins can manage staff" ON public.staff_members;
CREATE POLICY "Super admins can manage staff" 
ON public.staff_members 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role IN ('super_admin', 'admin') OR is_super_admin = true)
    )
);

DROP POLICY IF EXISTS "Dono pode gerenciar staff" ON public.staff_members;
CREATE POLICY "Dono pode gerenciar staff" 
ON public.staff_members 
FOR ALL 
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants 
        WHERE owner_id = auth.uid()
    )
);

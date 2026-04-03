-- Migração para adicionar campo de Composição / Extensão de pratos
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS composition TEXT;

-- Garantir que a coluna tenha permissões de visualização pública
-- (Se o RLS estiver ativado, as políticas SELECT * costumam cobrir novas colunas)
COMMENT ON COLUMN public.menu_items.composition IS 'Detalhes técnicos ou lista de acompanhamentos do prato/bebida.';

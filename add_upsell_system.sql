-- Adicionar coluna para armazenar IDs dos itens de upsell
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS upsell_ids JSONB DEFAULT '[]';

-- Comentário para documentação
COMMENT ON COLUMN menu_items.upsell_ids IS 'Lista de IDs de menu_items sugeridos como upsell para este item';

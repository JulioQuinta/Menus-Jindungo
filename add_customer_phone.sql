-- Adicionar coluna para telemóvel do cliente (Essencial para CRM Corporate)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Comentário para o Admin saber o que isto faz
COMMENT ON COLUMN orders.customer_phone IS 'Número de WhatsApp do cliente para CRM e fidelização';

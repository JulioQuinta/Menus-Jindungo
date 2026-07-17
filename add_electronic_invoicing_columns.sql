-- Script de Migração: Colunas de Faturação Eletrónica & Imutabilidade (AGT Angola)
-- Adiciona colunas para controle da API REST e assinatura JWS

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(20) DEFAULT 'draft' CHECK (invoice_status IN ('draft', 'pending_agt', 'validated', 'rejected')),
ADD COLUMN IF NOT EXISTS request_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS validation_code VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS jws_hash TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) DEFAULT NULL;

-- Criar índice para buscas rápidas de sincronização de faturas pendentes
CREATE INDEX IF NOT EXISTS idx_orders_invoice_pending 
ON public.orders (invoice_status) 
WHERE invoice_status = 'pending_agt';

-- Função da Trigger de Imutabilidade das Faturas
CREATE OR REPLACE FUNCTION public.enforce_invoice_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o registro estiver sendo deletado e já possuía uma fatura validada ou pendente
    IF TG_OP = 'DELETE' THEN
        IF OLD.invoice_status IN ('validated', 'pending_agt') THEN
            RAISE EXCEPTION 'Erro Fiscal: Faturas validadas ou em processamento na AGT não podem ser eliminadas. Cancele através de Nota de Crédito.';
        END IF;
        RETURN OLD;
    END IF;

    -- Se o registro estiver sendo atualizado
    IF TG_OP = 'UPDATE' THEN
        -- Impedir alteração do status para um estado anterior ou alteração de dados críticos se validada
        IF OLD.invoice_status = 'validated' THEN
            -- Permite apenas alteração de status logísticos secundários se estritamente necessário,
            -- mas bloqueia preços, itens, NIFs, totais ou alteração do próprio status da fatura.
            IF NEW.total <> OLD.total OR 
               NEW.items::text <> OLD.items::text OR 
               NEW.restaurant_id <> OLD.restaurant_id OR
               NEW.invoice_number <> OLD.invoice_number OR
               NEW.invoice_status <> OLD.invoice_status THEN
                RAISE EXCEPTION 'Erro Fiscal: Dados de faturas validadas pela AGT são imutáveis e não podem ser editados.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a Trigger na tabela orders
DROP TRIGGER IF EXISTS tr_enforce_invoice_immutability ON public.orders;
CREATE TRIGGER tr_enforce_invoice_immutability
BEFORE UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_invoice_immutability();

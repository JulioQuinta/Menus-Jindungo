-- ====================================================================
-- SCRIPT: SUPORTE A MÓDULOS DE PLATAFORMA (Menús Jindungo)
-- Módulos: 
--   1. 'billing_only' (Apenas Faturação AGT Simples, sem Menu QR público)
--   2. 'qr_only'      (Apenas Menu QR & Pedidos/KDS, sem Faturação AGT)
--   3. 'full_suite'   (Completo: Faturação AGT + Menu QR + Stock)
-- ====================================================================

-- 1. Adicionar coluna 'module_type' na tabela de restaurantes
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS module_type TEXT NOT NULL DEFAULT 'full_suite';

-- 2. Adicionar verificação de restrição para garantir valores válidos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_module_type'
    ) THEN
        ALTER TABLE public.restaurants 
        ADD CONSTRAINT check_valid_module_type 
        CHECK (module_type IN ('billing_only', 'qr_only', 'full_suite'));
    END IF;
END $$;

-- 3. Adicionar coluna 'module_type' na tabela de perfis (opcional, para conveniência no registo)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'full_suite';

-- 4. Atualizar restaurantes existentes sem módulo para 'full_suite'
UPDATE public.restaurants 
SET module_type = 'full_suite' 
WHERE module_type IS NULL OR module_type = '';

-- 6. Adicionar coluna 'business_sector' na tabela de restaurantes
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS business_sector TEXT NOT NULL DEFAULT 'retail';

-- 7. Adicionar coluna 'business_sector' na tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_sector TEXT DEFAULT 'retail';

-- 8. Criar índice para consultas filtradas por sector no Super Admin
CREATE INDEX IF NOT EXISTS idx_restaurants_business_sector ON public.restaurants(business_sector);


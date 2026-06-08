-- ====================================================================
-- SCRIPT: ISOLAMENTO SEGURO DE CREDENCIAIS E OUTBOX QUEUE (OWASP A01:2021)
-- ====================================================================
-- Este script separa as chaves de API do WhatsApp Gateway da coluna pública 
-- 'restaurants.business_info', movendo-as para uma tabela restrita com RLS.
-- Adicionalmente, cria a fila de envio 'whatsapp_outbox_messages'.

-- 1. Criar tabela privada de configurações de gateway
CREATE TABLE IF NOT EXISTS public.private_gateway_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    api_url TEXT NOT NULL,
    token TEXT NOT NULL,
    instance_name TEXT NOT NULL,
    gateway_type TEXT DEFAULT 'evolution',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id)
);

-- Ativar Row Level Security (RLS) na tabela privada
ALTER TABLE public.private_gateway_configs ENABLE ROW LEVEL SECURITY;

-- Criar política: Apenas o proprietário do restaurante pode gerir as suas credenciais
DROP POLICY IF EXISTS "Owners can manage their own private gateway configs" ON public.private_gateway_configs;
CREATE POLICY "Owners can manage their own private gateway configs" ON public.private_gateway_configs
    FOR ALL TO authenticated
    USING (
        auth.uid() IN (SELECT owner_id FROM public.restaurants WHERE id = restaurant_id)
    );

-- 2. Migrar dados existentes da coluna JSONB pública para a tabela privada
INSERT INTO public.private_gateway_configs (restaurant_id, api_url, token, instance_name, gateway_type)
SELECT 
    id,
    business_info->'whatsapp_gateway'->>'apiUrl',
    business_info->'whatsapp_gateway'->>'token',
    business_info->'whatsapp_gateway'->>'instanceName',
    COALESCE(business_info->'whatsapp_gateway'->>'gatewayType', 'evolution')
FROM public.restaurants
WHERE business_info ? 'whatsapp_gateway' 
  AND business_info->'whatsapp_gateway'->>'apiUrl' IS NOT NULL
  AND business_info->'whatsapp_gateway'->>'token' IS NOT NULL
ON CONFLICT (restaurant_id) DO UPDATE SET
    api_url = EXCLUDED.api_url,
    token = EXCLUDED.token,
    instance_name = EXCLUDED.instance_name,
    gateway_type = EXCLUDED.gateway_type;

-- 3. Limpar a chave sensível do objeto JSONB público e marcar a flag de ativação segura
UPDATE public.restaurants
SET business_info = (business_info - 'whatsapp_gateway') || '{"has_whatsapp_gateway": true}'::jsonb
WHERE business_info ? 'whatsapp_gateway';

-- 4. Criar tabela de fila/outbox de mensagens de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_outbox_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS no outbox
ALTER TABLE public.whatsapp_outbox_messages ENABLE ROW LEVEL SECURITY;

-- Permissões do outbox:
-- A. Utilizador público do checkout pode INSERIR novos pedidos de disparo
DROP POLICY IF EXISTS "Public can insert outbox messages" ON public.whatsapp_outbox_messages;
CREATE POLICY "Public can insert outbox messages" ON public.whatsapp_outbox_messages
    FOR INSERT WITH CHECK (true);

-- B. Apenas o proprietário autenticado pode ler, processar e atualizar o outbox
DROP POLICY IF EXISTS "Owners can manage outbox messages" ON public.whatsapp_outbox_messages;
CREATE POLICY "Owners can manage outbox messages" ON public.whatsapp_outbox_messages
    FOR ALL TO authenticated
    USING (
        auth.uid() IN (SELECT owner_id FROM public.restaurants WHERE id = restaurant_id)
    );

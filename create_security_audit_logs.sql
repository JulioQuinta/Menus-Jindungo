-- ====================================================================
-- SCRIPT: MONITORIZAÇÃO E AUDITORIA DE SEGURANÇA (OWASP A09:2021)
-- ====================================================================
-- Este script cria a infraestrutura de registos de eventos sensíveis
-- (como alteração de dados de pagamento, tentativas falhadas, RLS, etc.)

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    user_id UUID, -- UUID do utilizador em auth.users
    action TEXT NOT NULL,
    details TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Proprietários podem consultar os registos de segurança do seu próprio restaurante
DROP POLICY IF EXISTS "Owners can view their security logs" ON public.security_audit_logs;
CREATE POLICY "Owners can view their security logs" ON public.security_audit_logs
    FOR SELECT TO authenticated
    USING (
        restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
    );

-- Facilitar registo automático:
-- Criar uma função auxiliar em PL/pgSQL que pode ser executada por RPC/Trigger de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_restaurant_id UUID,
    p_action TEXT,
    p_details TEXT,
    p_severity TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_audit_logs (restaurant_id, user_id, action, details, severity)
    VALUES (p_restaurant_id, auth.uid(), p_action, p_details, p_severity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

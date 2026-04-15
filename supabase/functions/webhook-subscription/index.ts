import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

console.log("Webhook Subscription function running!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook Recebido! payload:", body);

    // Na realidade, os webhooks das operadoras precisam ser validados (assinatura via HMAC, etc.)
    // Vamos simular a receção de um ID de sucesso ou transação:
    const { transaction_id, status, is_subscription, restaurant_id, plan_id } = body;

    if (!transaction_id || status !== 'success' || !restaurant_id) {
       // Se o status da transação não foi de sucesso, ignoramos.
       return new Response(JSON.stringify({ message: 'Callback recebido, mas não elegível.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
       });
    }

    // Apenas validamos renovações de assinatura de restaurantes via webhook:
    if (is_subscription) {
      // Inicia o Supabase client com chave de SERVICE_ROLE (ignora permissões RLS)
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // 1. Obtemos os dados atuais do restaurante
      const { data: currentRest, error: fetchErr } = await supabaseAdmin
        .from('restaurants')
        .select('valid_until, id')
        .eq('id', restaurant_id)
        .single();
        
      if (fetchErr) throw fetchErr;

      // 2. Calculamos o novo 'valid_until' (Adicionar +30 dias).
      // Se já estava muito expirado, os 30 dias contam a partir de hoje.
      // Se apenas estava perto de expirar, somam-se 30 dias ao prazo que já tinha.
      let currentVal = new Date(currentRest.valid_until);
      const today = new Date();
      if (currentVal < today) {
        currentVal = today;
      }
      
      currentVal.setDate(currentVal.getDate() + 30); // 30 dias renovação mensal

      // 3. Efetuar a atualização de segurança na base de dados
      const { error: updateErr } = await supabaseAdmin
        .from('restaurants')
        .update({ valid_until: currentVal.toISOString(), status: 'active', payment_status: 'paid' })
        .eq('id', restaurant_id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({ success: true, message: 'Plano do SaaS renovado com sucesso via Webhook!',  new_valid_until: currentVal.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Se fosse um webhook para encomendas (Checkout Final), o status mudaria para `paid`
    // e o `restaurant_id` e id da order seriam usados para atualizar o `orders`.
    return new Response(
      JSON.stringify({ message: "Webhook genérico processado." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error no webhook-subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Process Payment function up and running!");

serve(async (req) => {
  // Configuração CORS (Cross-Origin Resource Sharing)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, phone, order_id, restaurant_id, is_subscription } = await req.json();

    // Validação básica
    if (!amount || !phone) {
      return new Response(JSON.stringify({ error: 'Faltam os parâmetros obrigatórios: amount, phone' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // -------------------------------------------------------------------------------------
    // INTEGRAÇÃO DE BOILERPLATE P/ API MCX EXPRESS DE ANGOLA (Ex: ProxyPay / Paga3 / Unitel Money)
    // -------------------------------------------------------------------------------------
    /* 
      1. Contactar servidor da operadora para iniciar pagamento (Push MCX)
      
      const payload = {
        amount: amount,
        msisdn: phone, // Telemóvel do cliente
        customData: order_id || restaurant_id "Subscrição mensal",
      };

      const gatewayResponse = await fetch("https://api.proxypay.co.ao/v1/payments", {
         method: "POST",
         headers: {
            "Authorization": `Token ${Deno.env.get('GW_API_KEY')}`,
            "Content-Type": "application/json"
         },
         body: JSON.stringify(payload)
      });
      const data = await gatewayResponse.json();
    */
    
    // MOCK RESPONSE PARA TESTES "SANDBOX" (Para continuar antes de aplicar chaves de produção):
    // Na Sandbox, se o número for "999999999", falhamos o pagamento, caso contrário aprovamos.
    let status = 'waiting_confirmation';
    let transaction_id = 'txn_' + Date.now().toString(36);

    if (phone === '999999999') {
      return new Response(JSON.stringify({ error: 'Pagamento recusado pela operadora.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Retorna Sucesso da Submissão (Aguardando cliente confirmar no MCX Express)
    return new Response(
      JSON.stringify({ 
        message: 'Pedido de pagamento enviado com sucesso para o telemóvel! Confirme no MCX Express.',
        transaction_id,
        status, 
        amount,
        phone
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error no process-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

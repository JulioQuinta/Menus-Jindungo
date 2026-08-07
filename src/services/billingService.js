import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export const billingService = {
    // 1. Simulação de Assinatura Criptográfica JWS (RS256)
    // Em produção, este método deve correr num ambiente de backend seguro (ex: Supabase Edge Functions)
    // para proteger a chave privada da Software House.
    async generateJWSSignature(payload) {
        try {
            const header = {
                alg: "RS256",
                typ: "JWS",
                cert_no: "000/JINDUNGO/2026"
            };

            const headerBase64 = btoa(JSON.stringify(header))
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");

            const payloadBase64 = btoa(JSON.stringify(payload))
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");

            // Simula a encriptação com a chave privada RSA
            // Criamos um hash simulado mas consistente baseado no conteúdo da fatura
            const hashSource = `${headerBase64}.${payloadBase64}`;
            let signatureHash = 0;
            for (let i = 0; i < hashSource.length; i++) {
                signatureHash = (signatureHash << 5) - signatureHash + hashSource.charCodeAt(i);
                signatureHash |= 0;
            }
            
            const rawSignature = Math.abs(signatureHash).toString(16).repeat(4) + "abcdef1234567890";
            const signatureBase64 = btoa(rawSignature)
                .slice(0, 44)
                .replace(/=/g, "")
                .replace(/\+/g, "-")
                .replace(/\//g, "_");

            const fullJWS = `${headerBase64}.${payloadBase64}.${signatureBase64}`;
            
            // O código de controlo impresso no rodapé é composto pelo 1º, 11º, 21º e 31º caracteres da assinatura
            const controlChars = `${signatureBase64[0] || 'X'}${signatureBase64[10] || 'y'}${signatureBase64[20] || 'Z'}${signatureBase64[30] || '1'}`;

            return {
                jws: fullJWS,
                hashControl: controlChars.toUpperCase(),
                signature: signatureBase64
            };
        } catch (err) {
            console.error("Error generating JWS signature:", err);
            throw new Error("Falha ao assinar documento digitalmente.");
        }
    },

    // 2. Comunicar Fatura à API REST da AGT (Envio Assíncrono)
    async emitirFaturaEletronica(orderId, restaurantId, orderData) {
        try {
            console.log(`Iniciando emissão de fatura eletrónica para o pedido #${orderId}...`);
            
            // Obter configurações fiscais do restaurante
            const invoiceConfig = orderData.restaurant?.invoice_config || {};
            const vatRate = typeof invoiceConfig.vat_rate === 'number' ? invoiceConfig.vat_rate : 14;
            const isExempt = vatRate === 0;

            // Determinar o tipo de documento
            const isDelivery = orderData.table_number?.includes('Entrega:') || orderData.order_type === 'delivery';
            const docType = (orderData.customer_nif && orderData.customer_nif !== '999999999') ? 'FR' : 'FS'; // FR (Fatura-Recibo) se tiver NIF real, FS (Fatura Simplificada) caso contrário
            
            // Gerar número sequencial simulado da série da AGT
            const currentYear = new Date().getFullYear();
            const sequence = Math.floor(1000 + Math.random() * 9000);
            const invoiceNumber = `${docType} ${currentYear}/${sequence}`;

            // 1. Preparar Payload Fiscal em estrita conformidade com a especificação AGT DS-120
            const netTotal = (orderData.total || 0) / (1 + (vatRate / 100));
            const taxPayable = (orderData.total || 0) - netTotal;

            const lines = (orderData.items || []).map((item, index) => {
                const itemNet = (item.price * item.quantity) / (1 + (vatRate / 100));
                const itemTax = (item.price * item.quantity) - itemNet;
                return {
                    lineNumber: String(index + 1),
                    productCode: item.id || `P00${index + 1}`,
                    productDescription: item.name,
                    quantity: String(item.quantity),
                    unitOfMeasure: "UN",
                    unitPrice: item.price.toFixed(2),
                    unitPriceBase: item.price.toFixed(2),
                    creditAmount: itemNet.toFixed(2),
                    taxes: [
                        {
                            taxType: isExempt ? "NS" : "IVA",
                            taxCountryRegion: "AO",
                            taxCode: isExempt ? (invoiceConfig.exemption_code || "M10") : "NOR",
                            taxPercentage: String(vatRate),
                            taxContribution: itemTax.toFixed(2)
                        }
                    ],
                    settlementAmount: (item.price * item.quantity).toFixed(2)
                };
            });

            const documentTotals = {
                taxPayable: taxPayable.toFixed(2),
                netTotal: netTotal.toFixed(2),
                grossTotal: (orderData.total || 0).toFixed(2)
            };

            const fiscalPayload = {
                documentNo: invoiceNumber,
                taxRegistrationNumber: invoiceConfig.nif || orderData.restaurant?.nif || "5002569450",
                documentType: docType,
                documentDate: new Date().toISOString().split('T')[0],
                customerTaxID: orderData.customer_nif || "999999999",
                customerCountry: "AO",
                companyName: orderData.restaurant?.name || "SUMBA AQUI - COMÉRCIO E SERVIÇOS,(SU) Lda",
                documentTotals: documentTotals
            };

            // 2. Gerar assinatura digital JWS
            const { jws, hashControl } = await this.generateJWSSignature(fiscalPayload);

            // 3. Atualizar Estado Local no Supabase para 'pending_agt' e gravar o requestID fictício
            const requestId = `REQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    invoice_status: 'pending_agt',
                    request_id: requestId,
                    invoice_number: invoiceNumber,
                    jws_hash: jws
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // 4. Iniciar processo assíncrono simulado de validação da AGT (Polling)
            this.iniciarProcessamentoSimuladoAGT(orderId, requestId, hashControl);

            return { success: true, requestId, invoiceNumber };
        } catch (err) {
            console.error("Erro na emissão da fatura eletrónica:", err);
            toast.error("Erro ao emitir fatura eletrónica.");
            return { success: false, error: err.message };
        }
    },

    // 3. Processamento Assíncrono Simulado (Fila da AGT)
    // Simula a fila de espera do Web Service da AGT que processa a fatura e retorna o código de validação
    iniciarProcessamentoSimuladoAGT(orderId, requestId, hashControl) {
        const agtProcessingTime = 6000; // 6 segundos de processamento simulado na fila da AGT
        
        console.log(`[AGT Web Service] Fatura associada ao pedido #${orderId} adicionada à fila (Request ID: ${requestId})...`);

        setTimeout(async () => {
            try {
                // Simulação de validação bem-sucedida (95% de chance de sucesso, 5% rejeitado para testes)
                const isValidated = Math.random() < 0.95;
                const status = isValidated ? 'validated' : 'rejected';
                
                // Código oficial de validação fiscal da AGT
                const validationCode = isValidated 
                    ? `AGT-VAL-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${hashControl}` 
                    : null;

                const { error } = await supabase
                    .from('orders')
                    .update({
                        invoice_status: status,
                        validation_code: validationCode
                    })
                    .eq('id', orderId);

                if (error) throw error;
                
                if (isValidated) {
                    console.log(`[AGT Web Service] Fatura para o pedido #${orderId} validada com sucesso! Código: ${validationCode}`);
                    toast.success("Fatura Eletrónica Validada pela AGT!", {
                        icon: '🛡️',
                        duration: 5000,
                        style: {
                            background: '#161616',
                            color: '#fff',
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            borderRadius: '20px',
                            fontFamily: 'serif'
                        }
                    });
                } else {
                    console.warn(`[AGT Web Service] Fatura para o pedido #${orderId} rejeitada por inconsistência de dados.`);
                    toast.error("Fatura rejeitada pelo Web Service da AGT.");
                }
            } catch (err) {
                console.error("Erro no processador assíncrono da AGT:", err);
            }
        }, agtProcessingTime);
    },

    // 4. Verificação de NIF em tempo real (Consome dados simulados baseados na base de dados da AGT)
    async verificarNIF(nif) {
        try {
            console.log(`Consultando NIF: ${nif} na base de dados da AGT...`);
            
            // Simulação de delay de rede
            await new Promise(resolve => setTimeout(resolve, 800));

            const cleanNif = String(nif).trim().replace(/\D/g, "");
            
            // Dicionário de NIFs de simulação
            const nifDatabase = {
                "5417289301": { name: "Jindungo Lounge & Grill, Lda", address: "Av. Talatona, Edifício Jindungo, Luanda" },
                "1042893122": { name: "Cláudio Manuel dos Santos", address: "Rua Direita de Luanda, Bloco C, Maianga" },
                "999999999": { name: "Consumidor Final", address: "Luanda, Angola" }
            };

            const clientInfo = nifDatabase[cleanNif];
            if (clientInfo) {
                return { found: true, ...clientInfo };
            }

            // Fallback para nomes genéricos simulados
            if (cleanNif.length === 9 || cleanNif.length === 10) {
                return { 
                    found: true, 
                    name: `Contribuinte Individual #${cleanNif.slice(-4)}`, 
                    address: "Luanda, Angola" 
                };
            }

            return { found: false, error: "NIF não localizado no Portal do Contribuinte da AGT." };
        } catch (err) {
            console.error("Erro ao verificar NIF:", err);
            return { found: false, error: err.message };
        }
    }
};

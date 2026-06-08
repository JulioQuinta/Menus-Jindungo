// C:\\Users\\Julio Quintas\\Documents\\Menús Jindungos\\src\\services\\whatsappService.js

export const whatsappService = {
    /**
     * Send a single WhatsApp message via a configured API Gateway
     */
    async sendWhatsAppMessage(gatewayConfig, targetPhone, textMessage) {
        if (!gatewayConfig || !gatewayConfig.apiUrl || !gatewayConfig.token || !gatewayConfig.instanceName) {
            throw new Error("Configuração do gateway de WhatsApp incompleta.");
        }

        const cleanPhone = String(targetPhone).replace(/\D/g, '');
        const finalPhone = cleanPhone.startsWith('244') ? cleanPhone : '244' + cleanPhone;

        const { apiUrl, token, instanceName, gatewayType = 'evolution' } = gatewayConfig;
        const sanitizedUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash if any

        let url = '';
        let headers = { 'Content-Type': 'application/json' };
        let body = {};

        if (gatewayType === 'zapi') {
            // Z-API Endpoint structure
            url = `${sanitizedUrl}/instances/${instanceName}/token/${token}/send-text`;
            body = {
                phone: finalPhone,
                message: textMessage
            };
        } else {
            // Evolution API Endpoint structure (Default)
            url = `${sanitizedUrl}/message/sendText/${instanceName}`;
            headers['apikey'] = token;
            body = {
                number: finalPhone,
                options: {
                    delay: 1000,
                    presence: 'composing'
                },
                textMessage: {
                    text: textMessage
                }
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gateway Error (${response.status}): ${errText}`);
            }

            return await response.json();
        } catch (e) {
            console.error("Failed to send WhatsApp message via gateway:", e);
            throw e;
        }
    },

    /**
     * Send bulk messages to multiple targets with safe randomized delays to prevent spam bans
     */
    async sendBulkCampaign(gatewayConfig, targets, textMessageTemplate, onProgress = () => {}) {
        const results = {
            success: 0,
            failed: 0,
            details: []
        };

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            
            // Personalize template
            const message = textMessageTemplate.replace(/\{nome\}/gi, target.name || 'Cliente');

            try {
                // Introduce delay before sending, except for the very first message
                if (i > 0) {
                    const delayMs = 2000 + Math.random() * 2000; // 2 to 4 seconds random delay
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }

                await this.sendWhatsAppMessage(gatewayConfig, target.phone, message);
                results.success += 1;
                results.details.push({ phone: target.phone, status: 'success' });
            } catch (e) {
                results.failed += 1;
                results.details.push({ phone: target.phone, status: 'failed', error: e.message });
            }

            // Report progress in real-time
            onProgress({
                current: i + 1,
                total: targets.length,
                successCount: results.success,
                failedCount: results.failed,
                pct: Math.round(((i + 1) / targets.length) * 100)
            });
        }

        return results;
    }
};

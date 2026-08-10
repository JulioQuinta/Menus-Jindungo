import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const GEMINI_CACHE_PREFIX = 'gemini_cache_item_';
const RATE_LIMIT_COOLDOWN_MS = 15000; // 15 segundos

export const useGeminiFree = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const cooldownTimerRef = useRef(null);
    const isCooldownActive = useRef(false);

    const startRateLimitCooldown = useCallback(() => {
        isCooldownActive.current = true;
        setCooldownRemaining(15);
        
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        
        cooldownTimerRef.current = setInterval(() => {
            setCooldownRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(cooldownTimerRef.current);
                    isCooldownActive.current = false;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const generateMagicDescription = useCallback(async (item, customPrompt = '') => {
        if (!item || !item.name) return null;

        // 1. Verificar Cache Local (SessionStorage) para evitar gastos de API
        const cacheKey = `${GEMINI_CACHE_PREFIX}${item.id || item.name}`;
        const cachedResponse = sessionStorage.getItem(cacheKey);
        if (cachedResponse) {
            console.log("✨ [Gemini Cache] Resposta recuperada do sessionStorage para:", item.name);
            return cachedResponse;
        }

        // 2. Verificar Estado de Cooldown (Rate Limit Ativo)
        if (isCooldownActive.current) {
            const msg = "O assistente está a processar muitos dados neste momento. Por favor, aguarda 15 segundos antes da próxima pergunta.";
            toast.error(msg, { duration: 5000 });
            throw new Error(msg);
        }

        // 3. Obter e Validar a API Key Segura
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ VITE_GEMINI_API_KEY não configurada. A usar sugestão mágica de fallback local.");
            const fallbacks = [
                `Um delicioso prato de ${item.name} preparado cuidadosamente com os ingredientes mais frescos. Irresistível a cada dentada!`,
                `A nossa especialidade! O ${item.name} tem um sabor autêntico e único, perfeito para tornar a sua refeição inesquecível.`,
                `Sabor excecional. Peça o seu ${item.name} agora e deixe-se surpreender pela combinação perfeita de aromas.`
            ];
            const fallbackText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            sessionStorage.setItem(cacheKey, fallbackText);
            return fallbackText;
        }

        setIsLoading(true);

        try {
            const promptText = customPrompt || `Atua como um copywriter de culinária de elite para um restaurante premium. Escreve uma descrição irresistível, curta (máximo 2 frases) e altamente sedutora para o prato "${item.name}". Não uses aspas na resposta nem formatação markdown.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 120
                    }
                })
            });

            if (response.status === 429) {
                startRateLimitCooldown();
                const rateLimitMsg = "O assistente está a processar muitos dados neste momento. Por favor, aguarda 15 segundos antes da próxima pergunta.";
                toast.error(rateLimitMsg, { duration: 6000 });
                throw new Error(rateLimitMsg);
            }

            if (!response.ok) {
                throw new Error(`Erro na API Gemini: ${response.statusText} (${response.status})`);
            }

            const data = await response.json();
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

            if (generatedText) {
                // Limpar eventuais aspas extras
                const cleanText = generatedText.replace(/^["']|["']$/g, '').trim();
                sessionStorage.setItem(cacheKey, cleanText);
                return cleanText;
            }

            throw new Error("Resposta da IA vazia.");
        } catch (error) {
            console.error("❌ [Gemini Error]:", error);
            if (error.message?.includes('processar muitos dados')) {
                throw error;
            }
            throw new Error("Não foi possível conectar à IA mágica neste momento.");
        } finally {
            setIsLoading(false);
        }
    }, [startRateLimitCooldown]);

    const sendChatMessage = useCallback(async (userMessage, chatHistory = [], contextData = {}) => {
        if (isCooldownActive.current) {
            const msg = "O assistente está a processar. Aguarde 15 segundos.";
            toast.error(msg);
            throw new Error(msg);
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ API Key do Gemini em falta. A simular resposta local.");
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(simulateLocalResponse(userMessage, contextData));
                }, 800);
            });
        }

        setIsLoading(true);

        try {
            const systemInstruction = `
            Tu és o Assistente de Inteligência Artificial do "Menús Jindungo", um sistema de gestão e faturação premium para restaurantes em Angola.
            O teu papel é ajudar o administrador/gerente do restaurante com análises de vendas, sugestões de marketing, melhorias no menu, sugestão de descrições e gestão de stock.
            Responde sempre em português com um tom profissional, amigável, entusiasmado e executivo.
            Usa termos locais como "Kwanzas" ou "Kz" para preços.
            
            Informações sobre o Restaurante Atual (Comidas da Terra):
            - Pratos no Menu: ${JSON.stringify(contextData.itemsSummary || [])}
            - Stock Crítico (Baixo): ${JSON.stringify(contextData.lowStockNames || 'Nenhum')}
            - Métricas de Stock: Valor de venda total em stock de ${contextData.totalSalesValue || 0} Kz, saúde do inventário de ${contextData.healthRatio || 100}%.
            
            Regra Importante: Responde de forma curta, estruturada (máximo 4-5 linhas ou pequenos tópicos). Se te pedirem para criar uma descrição de prato, sê muito criativo e sedutor.
            `;

            const contents = [
                {
                    role: 'user',
                    parts: [{ text: systemInstruction }]
                },
                ...chatHistory.map(msg => ({
                    role: msg.type === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                })),
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ];

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 250
                    }
                })
            });

            if (response.status === 429) {
                startRateLimitCooldown();
                throw new Error("Limite de requisições excedido. Aguarde 15 segundos.");
            }

            if (!response.ok) {
                throw new Error(`Erro na API Gemini: ${response.status}`);
            }

            const data = await response.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (!reply) throw new Error("A IA respondeu com um texto vazio.");

            return reply;

        } catch (e) {
            console.error("Chat API error:", e);
            throw new Error(e.message || "Não foi possível contactar o assistente de IA.");
        } finally {
            setIsLoading(false);
        }
    }, [startRateLimitCooldown]);

    return {
        generateMagicDescription,
        sendChatMessage,
        isLoading,
        cooldownRemaining,
        isRateLimited: cooldownRemaining > 0
    };
};

const localFormatCurr = (val) => {
    return new Intl.NumberFormat('pt-AO').format(val || 0) + ' Kz';
};

const simulateLocalResponse = (message, context) => {
    const text = message.toLowerCase();
    
    if (text.includes('preço') || text.includes('valor') || text.includes('venda') || text.includes('faturação') || text.includes('lucro')) {
        return `📊 Análise de Faturação: O Comidas da Terra faturou um total estimado de ${localFormatCurr(context.totalSalesValue)} Kz com base no stock atual. Margem de lucro média de ${context.avgMargin || 0}%. Gostaria de ajustar algum preço para otimizar a margem?`;
    }
    if (text.includes('stock') || text.includes('inventário') || text.includes('compras') || text.includes('alerta') || text.includes('crítico')) {
        return `📦 Alerta de Stock: Existem ${context.lowStockCount || 0} itens em estado crítico (abaixo do stock mínimo). Recomendo abastecer os seguintes itens: ${context.lowStockNames || 'Nenhum item em alerta'}. Posso abrir a Lista de Compras para si!`;
    }
    if (text.includes('descrição') || text.includes('sugere') || text.includes('criar') || text.includes('escrever')) {
        return `✨ Sugestão Mágica IA: "Uma combinação divina de sabores tradicionais preparados com os ingredientes mais frescos do nosso mercado local. Uma iguaria feita para surpreender e deliciar a sua mesa!" Gostaria de aplicar este texto ao seu prato em destaque?`;
    }
    if (text.includes('olá') || text.includes('bom dia') || text.includes('boa tarde') || text.includes('ajuda') || text.includes('queres') || text.includes('quem és')) {
        return `👋 Olá! Sou o seu Assistente IA Jindungo. Estou aqui para ajudar a gerir o restaurante. Posso calcular faturamentos (${localFormatCurr(context.totalSalesValue)} Kz em stock), listar produtos abaixo do stock de segurança (${context.lowStockCount || 0} alertas), ou sugerir descrições premium para o menu digital. O que deseja fazer?`;
    }
    return `🤖 Recebi a sua mensagem: "${message}". Como o seu assistente de gestão, recomendo verificar a Saúde do Inventário (${context.healthRatio || 100}%) ou o Livro de Movimentações para auditoria de stock. Há algo mais que possa fazer?`;
};

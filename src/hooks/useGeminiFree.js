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

    return {
        generateMagicDescription,
        isLoading,
        cooldownRemaining,
        isRateLimited: cooldownRemaining > 0
    };
};

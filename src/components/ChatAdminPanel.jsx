import React, { useState, useRef, useEffect } from 'react';
import SimpleAnalytics from './SimpleAnalytics';
import { useGeminiFree } from '../hooks/useGeminiFree';
import { Send, Sparkles, MessageSquare, AlertCircle, RefreshCw, Smartphone, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatAdminPanel = ({ onUpdate, categories = [], restaurantId }) => {
    const { sendChatMessage, generateMagicDescription, isLoading: geminiLoading, cooldownRemaining, isRateLimited } = useGeminiFree();
    
    const [messages, setMessages] = useState([
        { type: 'bot', text: '👋 Olá! Sou o seu assistente de Inteligência Artificial para o Comidas da Terra. Posso analisar as suas vendas em stock, verificar produtos com pouco stock, ou criar descrições altamente sedutoras para o seu menu digital. Escreva a sua dúvida ou clique numa ação rápida abaixo!' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [magicProductSelect, setMagicProductSelect] = useState('');
    
    const endRef = useRef(null);
    const allItems = categories.flatMap(c => c.items || []);

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending, geminiLoading]);

    // Build context data about the restaurant from current database items
    const contextData = React.useMemo(() => {
        let totalSalesValue = 0;
        let totalCostValue = 0;
        let trackedCount = 0;
        let lowStockCount = 0;
        const lowStockNamesList = [];

        allItems.forEach(item => {
            if (item.track_stock) {
                trackedCount++;
                const qty = item.stock_quantity || 0;
                const cost = item.cost_price || 0;
                const sellPrice = parseInt(String(item.price || 0).replace(/[^0-9]/g, ''), 10) || 0;

                totalSalesValue += sellPrice * qty;
                totalCostValue += cost * qty;

                const safetyStock = item.min_safety_stock || 5;
                if (qty < safetyStock) {
                    lowStockCount++;
                    lowStockNamesList.push(item.name);
                }
            }
        });

        const estimatedProfit = totalSalesValue - totalCostValue;
        const avgMargin = totalSalesValue > 0 ? Math.round((estimatedProfit / totalSalesValue) * 100) : 0;
        const healthRatio = trackedCount > 0 ? Math.round(((trackedCount - lowStockCount) / trackedCount) * 100) : 100;

        return {
            totalSalesValue,
            totalCostValue,
            avgMargin,
            healthRatio,
            lowStockCount,
            lowStockNames: lowStockNamesList.join(', '),
            itemsSummary: allItems.slice(0, 10).map(i => ({ name: i.name, price: i.price, stock: i.stock_quantity }))
        };
    }, [allItems]);

    // Handle sending chat message
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = userInput.trim();
        if (!text || isSending || geminiLoading) return;

        setUserInput('');
        // Append user query
        setMessages(prev => [...prev, { type: 'user', text }]);
        setIsSending(true);

        try {
            // Fetch AI answer
            const reply = await sendChatMessage(text, messages, contextData);
            setMessages(prev => [...prev, { type: 'bot', text: reply }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { type: 'bot', text: `❌ Ocorreu um erro: ${err.message}` }]);
        } finally {
            setIsSending(false);
        }
    };

    // Trigger generate magic description directly from chat context
    const handleRequestMagicDesc = async (e) => {
        const itemId = e.target.value;
        if (!itemId) return;
        setMagicProductSelect('');

        const selectedItem = allItems.find(i => i.id === itemId);
        if (!selectedItem) return;

        setMessages(prev => [...prev, { type: 'user', text: `Gera uma descrição premium de copywriting para o prato "${selectedItem.name}"` }]);
        setIsSending(true);

        try {
            const prompt = `Atua como um copywriter de culinária de elite para um restaurante premium. Escreve uma descrição irresistível, curta (máximo 2 frases) e altamente sedutora para o prato "${selectedItem.name}". Não uses aspas nem formatação markdown.`;
            const reply = await sendChatMessage(prompt, messages, contextData);
            setMessages(prev => [...prev, { type: 'bot', text: `✨ Sugestão Mágica para "${selectedItem.name}":\n\n"${reply}"` }]);
        } catch (err) {
            setMessages(prev => [...prev, { type: 'bot', text: `❌ Falha ao gerar: ${err.message}` }]);
        } finally {
            setIsSending(false);
        }
    };

    const quickChips = [
        { label: '📊 Analisar Vendas', query: 'Faz um resumo das vendas totais estimadas em stock e margem de lucro.' },
        { label: '📦 Alertas de Stock', query: 'Quais são os itens com stock abaixo do nível de segurança?' },
        { label: '💡 Dicas de Marketing', query: 'Sugere 3 dicas de marketing para aumentar o ticket médio hoje.' },
        { label: '🍽️ Otimizar Menu', query: 'Como posso melhorar a apresentação e o layout dos meus pratos no menu?' }
    ];

    return (
        <div className="w-full min-h-[750px] flex flex-col bg-[#0A0A0B] text-white p-4 sm:p-8 relative overflow-hidden font-sans text-left">
            
            {/* Top Bar Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/5 gap-4 relative z-10">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-white flex items-center gap-2">
                        <Brain className="text-[#D4AF37]" size={28} />
                        Assistente de Inteligência Artificial
                    </h2>
                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-widest">
                        Análise de dados comercial, alertas de armazém e marketing em tempo real
                    </p>
                </div>
            </div>

            {/* Rate Limit Protection Banner */}
            {isRateLimited && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-6 py-3 rounded-2xl text-xs font-bold flex items-center justify-between mb-6 animate-pulse shadow-lg relative z-10">
                    <span className="flex items-center gap-2">
                        <span>⏳</span> Assistente ocupado. Por favor, aguarda {cooldownRemaining} segundos para estabilizar.
                    </span>
                    <span className="bg-amber-500 text-gray-950 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                        Proteção Cooldown
                    </span>
                </div>
            )}

            {/* TWO-COLUMN GRID: LEFT CHARTS, RIGHT COCKPIT CHAT */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch relative z-10">
                
                {/* Column 1 (Left): SimpleAnalytics & Metrics (60% width / 3 cols) */}
                <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
                    <div className="bg-[#141415]/80 backdrop-blur-md border border-white/5 p-6 rounded-[2.5rem] shadow-xl">
                        <SimpleAnalytics items={allItems} />
                    </div>
                </div>

                {/* Column 2 (Right): Interactive AI Chat Box (40% width / 2 cols) */}
                <div className="lg:col-span-2 flex flex-col bg-[#141415]/90 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[580px] h-full justify-between">
                    
                    {/* Chat Header */}
                    <div className="p-4 bg-[#1A1A1C] border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg animate-pulse">
                                🤖
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-wider">Assistente Virtual Jindungo</h3>
                                <p className="text-[10px] text-green-500 font-bold flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                                    Cognitivo Online
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-black/20 h-[380px] max-h-[380px]">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`p-4 max-w-[85%] rounded-2xl shadow-md text-xs leading-relaxed ${
                                msg.type === 'user'
                                    ? 'self-end bg-gradient-to-r from-[#D4AF37] to-amber-500 text-gray-950 font-bold rounded-br-sm'
                                    : 'self-start bg-[#222] text-gray-200 border border-white/5 font-medium rounded-bl-sm whitespace-pre-line'
                            }`}>
                                {msg.text}
                            </div>
                        ))}

                        {/* Loading Typing Indicator */}
                        {(isSending || geminiLoading) && (
                            <div className="self-start bg-[#222] p-4 rounded-2xl rounded-bl-sm border border-white/5 shadow-md flex items-center gap-3 animate-fade-in">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                    Processando Dados...
                                </span>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Quick Tools & Input Bar */}
                    <div className="bg-[#1A1A1C] border-t border-white/5 p-4 space-y-3">
                        
                        {/* Selector for Quick Copywriting Suggestion */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider shrink-0">Gerar Descrição:</span>
                            <select
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-gray-300 font-bold outline-none focus:border-[#D4AF37] cursor-pointer"
                                value={magicProductSelect}
                                onChange={handleRequestMagicDesc}
                                disabled={isSending || geminiLoading}
                            >
                                <option value="">Escolha um prato para fazer copywriting...</option>
                                {allItems.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quick Prompt Chips */}
                        <div className="flex flex-wrap gap-1.5">
                            {quickChips.map((chip, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setUserInput(chip.query)}
                                    disabled={isSending || geminiLoading}
                                    className="bg-black/40 hover:bg-black/70 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-wider transition-all cursor-pointer disabled:opacity-40"
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>

                        {/* Interactive Message Form */}
                        <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
                            <input 
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                disabled={isSending || geminiLoading}
                                placeholder="Pergunte ao Assistente de IA..."
                                className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] outline-none font-sans"
                            />
                            <button
                                type="submit"
                                disabled={!userInput.trim() || isSending || geminiLoading}
                                className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-black px-4 py-3 rounded-2xl text-xs font-black shadow-lg shadow-[#D4AF37]/15 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatAdminPanel;

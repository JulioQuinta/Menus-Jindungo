import React, { useState, useRef, useEffect } from 'react';
import SimpleAnalytics from './SimpleAnalytics';
import { supabase } from '../lib/supabaseClient';
import { useGeminiFree } from '../hooks/useGeminiFree';

const ChatAdminPanel = ({ onUpdate, categories = [], restaurantId }) => {
    const { generateMagicDescription, isLoading: geminiLoading, cooldownRemaining, isRateLimited } = useGeminiFree();
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Olá! Sou o seu assistente de Inteligência Artificial. O que vamos otimizar no menu hoje?' }
    ]);
    const [flow, setFlow] = useState({ active: false, action: null, step: null, item: null });
    const [isTyping, setIsTyping] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const endRef = useRef(null);

    const allItems = categories.flatMap(c => c.items || []);

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isChatOpen) {
            scrollToBottom();
        }
    }, [messages, flow, isChatOpen]);

    const handleActionClick = (action, label) => {
        if (isTyping || geminiLoading) return;
        setFlow({ active: false, action: null, step: null, item: null });
        setIsChatOpen(true);
        setMessages(prev => [...prev, { type: 'user', text: label }]);

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            if (['edit_price', 'out_of_stock', 'edit_text', 'new_photo', 'magic_desc'].includes(action)) {
                setMessages(prev => [...prev, { type: 'bot', text: 'Qual prato deseja alterar?' }]);
                setFlow({ active: true, action: action, step: 'SELECT_ITEM' });
            } else {
                setMessages(prev => [...prev, { type: 'bot', text: 'Opção não reconhecida. 📝' }]);
            }
        }, 800);
    };

    const handleDirectMagicClick = async () => {
        const targetItem = selectedItem || allItems[0] || { id: 'f1', name: 'Sacamadesu', price: '4500 Kz' };
        if (isTyping || geminiLoading || isRateLimited) return;
        
        setIsChatOpen(true);
        setIsTyping(true);
        setMessages(prev => [...prev, { type: 'user', text: `✨ Gerar Descrição Mágica IA para: "${targetItem.name}"` }]);

        try {
            const magicText = await generateMagicDescription(targetItem);
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: `✨ Sugestão Mágica para "${targetItem.name}":\n\n"${magicText}"` }]);
            setFlow({ active: true, action: 'magic_desc_confirm', step: 'CONFIRM_MAGIC', item: targetItem, data: magicText });
        } catch (err) {
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: `❌ ${err.message}` }]);
        }
    };

    const handleItemSelect = (itemId) => {
        if (!itemId) return;
        const item = allItems.find(i => i.id === itemId) || { id: itemId, name: 'Item Selecionado' };
        setMessages(prev => [...prev, { type: 'user', text: `Selecionei: ${item.name}` }]);
        setFlow({ active: false });
        setIsTyping(true);

        setTimeout(async () => {
            setIsTyping(false);
            if (flow.action === 'out_of_stock') {
                try {
                    const newVal = !(item.available !== false);
                    await supabase.from('menu_items').update({ available: newVal }).eq('id', item.id);
                    if (onUpdate) onUpdate();
                    setMessages(prev => [...prev, { type: 'bot', text: `✅ O prato "${item.name}" foi marcado como ${newVal ? 'Disponível' : 'Esgotado'} com sucesso na Base de Dados!` }]);
                } catch (e) {
                    setMessages(prev => [...prev, { type: 'bot', text: '❌ Ocorreu um erro ao atualizar o prato. Tente novamente.' }]);
                }
            } else if (flow.action === 'edit_price') {
                setMessages(prev => [...prev, { type: 'bot', text: `Qual é o novo preço para "${item.name}"? (Atual: ${item.price || 'Sob Consulta'})` }]);
                setFlow({ active: true, action: 'edit_price', step: 'INPUT_PRICE', item: item });
            } else if (flow.action === 'edit_text') {
                setMessages(prev => [...prev, { type: 'bot', text: `Escreva a nova descrição para "${item.name}":` }]);
                setFlow({ active: true, action: 'edit_text', step: 'INPUT_TEXT', item: item });
            } else if (flow.action === 'new_photo') {
                setMessages(prev => [...prev, { type: 'bot', text: `Faça upload da nova foto para "${item.name}":` }]);
                setFlow({ active: true, action: 'new_photo', step: 'INPUT_PHOTO', item: item });
            } else if (flow.action === 'magic_desc') {
                try {
                    setIsTyping(true);
                    const magicText = await generateMagicDescription(item);
                    setIsTyping(false);
                    setMessages(prev => [...prev, { type: 'bot', text: `✨ Sugestão Mágica para "${item.name}":\n\n"${magicText}"` }]);
                    setFlow({ active: true, action: 'magic_desc_confirm', step: 'CONFIRM_MAGIC', item: item, data: magicText });
                } catch (err) {
                    setIsTyping(false);
                    setMessages(prev => [...prev, { type: 'bot', text: `❌ ${err.message}` }]);
                }
            }
        }, 800);
    };

    const handlePriceSubmit = async (price) => {
        if (!price || !price.trim()) return;
        setMessages(prev => [...prev, { type: 'user', text: price }]);
        const item = flow.item;
        setFlow({ active: false });
        setIsTyping(true);
        try {
            await supabase.from('menu_items').update({ price: price }).eq('id', item.id);
            if (onUpdate) onUpdate();
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { type: 'bot', text: `✅ O preço de "${item.name}" foi atualizado para ${price} com sucesso!` }]);
            }, 800);
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: '❌ Erro ao atualizar preço na Base de Dados.' }]);
        }
    };

    const handleTextSubmit = async (desc) => {
        if (!desc || !desc.trim()) return;
        setMessages(prev => [...prev, { type: 'user', text: "Nova descrição enviada." }]);
        const item = flow.item;
        setFlow({ active: false });
        setIsTyping(true);
        try {
            await supabase.from('menu_items').update({ desc_text: desc }).eq('id', item.id);
            if (onUpdate) onUpdate();
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { type: 'bot', text: `✅ Descrição de "${item.name}" atualizada com sucesso!` }]);
            }, 800);
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: '❌ Erro ao atualizar descrição na Base de Dados.' }]);
        }
    };

    const handlePhotoSubmit = async (file) => {
        if (!file) return;
        setMessages(prev => [...prev, { type: 'user', text: `Enviando imagem: ${file.name}...` }]);
        const item = flow.item;
        setFlow({ active: false });
        setIsTyping(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `items/${restaurantId}/chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('menus').upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
            if (!publicUrl) throw new Error("Falha ao gerar URL");
            await supabase.from('menu_items').update({ img_url: publicUrl }).eq('id', item.id);
            if (onUpdate) onUpdate();
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { type: 'bot', text: `✅ Foto de "${item.name}" atualizada com sucesso!` }]);
            }, 800);
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: '❌ Erro ao enviar foto para a Base de Dados.' }]);
        }
    };

    const premiumChips = [
        { id: 'edit_price', label: '⚙️ Mudar Preço', color: 'bg-[#222] border border-gray-800 text-gray-200 hover:bg-[#333] hover:border-gray-700' },
        { id: 'out_of_stock', label: '🚫 Esgotar Prato', color: 'bg-[#2a1515] border border-red-900/50 text-red-400 hover:bg-[#3a1c1c] hover:border-red-800' },
        { id: 'edit_text', label: '📝 Editar Descrição', color: 'bg-[#222] border border-gray-800 text-gray-200 hover:bg-[#333] hover:border-gray-700' },
        { id: 'new_photo', label: '📷 Trocar Foto', color: 'bg-[#222] border border-gray-800 text-gray-200 hover:bg-[#333] hover:border-gray-700' }
    ];

    return (
        <div className="w-full min-h-[750px] flex flex-col bg-[#111] text-white p-6 sm:p-10 relative overflow-hidden font-sans">
            {/* Ambient Gold Glow Background */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>

            {/* Top Bar matching screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-gray-800/80 gap-4 relative z-10">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        Assistente de Gestão & Insights IA
                    </h1>
                    <p className="text-sm font-medium text-gray-400 mt-1">
                        Análise preditiva e automação mágica do menu em tempo real.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDirectMagicClick}
                        disabled={isTyping || geminiLoading || isRateLimited}
                        className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-gray-950 font-black px-6 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300/40 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <span>✨</span>
                        {isRateLimited ? `Aguarde (${cooldownRemaining}s)` : geminiLoading ? 'A Gerar IA...' : 'Descrição Mágica'}
                    </button>
                    {isChatOpen && (
                        <button
                            onClick={() => setIsChatOpen(false)}
                            className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-bold px-4 py-3.5 rounded-2xl border border-gray-700 text-xs uppercase tracking-wider transition-all"
                        >
                            Esconder Chat
                        </button>
                    )}
                </div>
            </div>

            {/* Rate Limit Protection Banner */}
            {isRateLimited && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-between mb-8 animate-pulse shadow-lg relative z-10">
                    <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> O assistente está a processar muitos dados neste momento. Por favor, aguarda {cooldownRemaining} segundos.
                    </span>
                    <span className="bg-amber-500 text-gray-950 px-3 py-1 rounded-full text-xs font-black">
                        Proteção Ativa
                    </span>
                </div>
            )}

            {/* Middle Section: Beautiful Charts & Popular Cards */}
            <div className="relative z-10 mb-10">
                <SimpleAnalytics items={allItems} onSelectItem={(item) => setSelectedItem(item)} />
            </div>

            {/* Bottom Quick Actions Section matching screenshot */}
            <div className="relative z-10 pt-6 border-t border-gray-800/80">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">AÇÕES RÁPIDAS</p>
                <div className="flex flex-wrap gap-3">
                    {premiumChips.map(chip => (
                        <button
                            key={chip.id}
                            onClick={() => handleActionClick(chip.id, chip.label)}
                            disabled={isTyping || geminiLoading}
                            className={`px-5 py-3 rounded-2xl text-sm font-extrabold tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${chip.color}`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Expandable Assistant Interactive Chat Modal */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-[#161616] border border-gray-800 sm:rounded-3xl rounded-t-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
                        {/* Chat Header */}
                        <div className="p-5 bg-[#1e1e1e] border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                    🤖
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white flex items-center gap-2">
                                        Assistente de IA Jindungo
                                    </h3>
                                    <p className="text-xs font-bold text-amber-500/80">Online e pronto a otimizar</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Chat Body (Messages) */}
                        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-[#121212]/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`p-4 max-w-[85%] rounded-2xl shadow-md text-sm leading-relaxed ${
                                    msg.type === 'user'
                                        ? 'self-end bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-bold rounded-br-sm'
                                        : 'self-start bg-[#242424] text-gray-200 border border-gray-800 font-medium rounded-bl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            ))}

                            {(isTyping || geminiLoading) && (
                                <div className="self-start bg-[#242424] p-4 rounded-2xl rounded-bl-sm border border-gray-800 shadow-md flex items-center gap-3 animate-fade-in">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-xs font-bold text-amber-400">
                                        {geminiLoading ? 'A gerar magia com IA...' : 'Assistente a analisar...'}
                                    </span>
                                </div>
                            )}

                            {/* Interactive Inputs inside chat */}
                            {flow.active && flow.step === 'SELECT_ITEM' && (
                                <div className="self-start bg-[#242424] p-5 rounded-3xl rounded-tl-sm border border-amber-500/30 w-full max-w-[85%] shadow-lg animate-fade-in">
                                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">Selecione o Prato:</p>
                                    <select
                                        className="w-full p-3.5 rounded-xl border border-gray-700 text-sm bg-[#161616] text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold"
                                        onChange={(e) => handleItemSelect(e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Escolha um prato do menu...</option>
                                        {allItems.filter(i => flow.action === 'out_of_stock' ? true : i.available !== false).map(item => (
                                            <option key={item.id} value={item.id}>{item.name} - {item.price || 'Sob Consulta'}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {flow.active && flow.step === 'INPUT_PRICE' && (
                                <div className="self-start bg-[#242424] p-5 rounded-3xl rounded-tl-sm border border-amber-500/30 w-full max-w-[85%] shadow-lg flex flex-col gap-3 animate-fade-in">
                                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider">Novo Preço para: {flow.item?.name}</p>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 rounded-xl border border-gray-700 text-sm bg-[#161616] text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-bold"
                                        placeholder="Ex: 5500 Kz"
                                        id="modal-price-input"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handlePriceSubmit(e.target.value);
                                        }}
                                    />
                                    <button
                                        onClick={() => handlePriceSubmit(document.getElementById('modal-price-input').value)}
                                        className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-4 py-3 w-full rounded-xl text-sm transition-all shadow-md"
                                    >
                                        Confirmar Novo Preço
                                    </button>
                                </div>
                            )}

                            {flow.active && flow.step === 'INPUT_TEXT' && (
                                <div className="self-start bg-[#242424] p-5 rounded-3xl rounded-tl-sm border border-amber-500/30 w-full max-w-[85%] shadow-lg flex flex-col gap-3 animate-fade-in">
                                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider">Nova Descrição para: {flow.item?.name}</p>
                                    <textarea
                                        className="w-full p-3.5 rounded-xl border border-gray-700 text-sm bg-[#161616] text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium resize-y min-h-[100px]"
                                        placeholder="Escreva os ingredientes e detalhes..."
                                        id="modal-text-input"
                                        defaultValue={flow.item?.desc_text || ''}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleTextSubmit(document.getElementById('modal-text-input').value)}
                                        className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-4 py-3 w-full rounded-xl text-sm transition-all shadow-md"
                                    >
                                        Guardar Nova Descrição
                                    </button>
                                </div>
                            )}

                            {flow.active && flow.step === 'INPUT_PHOTO' && (
                                <div className="self-start bg-[#242424] p-5 rounded-3xl rounded-tl-sm border border-amber-500/30 w-full max-w-[85%] shadow-lg animate-fade-in">
                                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">Nova Foto para: {flow.item?.name}</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="modal-photo-input"
                                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 transition-all cursor-pointer mb-4 bg-[#161616] p-2 rounded-xl border border-gray-700"
                                    />
                                    <button
                                        onClick={() => {
                                            const fileInput = document.getElementById('modal-photo-input');
                                            if (fileInput.files.length) handlePhotoSubmit(fileInput.files[0]); else alert('Escolha um ficheiro de imagem.');
                                        }}
                                        className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-black px-4 py-3 w-full rounded-xl text-sm transition-all shadow-md"
                                    >
                                        Enviar Imagem
                                    </button>
                                </div>
                            )}

                            {flow.active && flow.step === 'CONFIRM_MAGIC' && (
                                <div className="self-start bg-[#242424] p-5 rounded-3xl rounded-tl-sm border border-amber-500/40 w-full max-w-[85%] shadow-xl animate-fade-in">
                                    <p className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span>✨</span> Aplicar sugestão mágica ao menu?
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleTextSubmit(flow.data)}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-amber-500/20 transition-all"
                                        >
                                            👍 Sim, Aplicar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMessages(prev => [...prev, { type: 'user', text: "Não gostei. Cancela." }, { type: 'bot', text: 'Entendido. Escolha outra opção ou prato. 🤖' }]);
                                                setFlow({ active: false });
                                            }}
                                            className="px-5 bg-[#333] hover:bg-[#444] text-gray-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
                                        >
                                            👎 Não
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div ref={endRef} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatAdminPanel;

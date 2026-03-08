import React, { useState, useRef, useEffect } from 'react';
import SimpleAnalytics from './SimpleAnalytics';
import { supabase } from '../lib/supabaseClient';

const ChatAdminPanel = ({ onUpdate, categories, restaurantId }) => {
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Olá! Sou o seu assistente virtual. O que vamos atualizar no menu hoje?' }
    ]);
    const [flow, setFlow] = useState({ active: false, action: null, step: null, item: null });
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef(null);

    // Filter available items early
    const allItems = categories.flatMap(c => c.items || []);

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, flow]);

    const handleActionClick = (action, label) => {
        if (isTyping) return; // Wait for current bot typing only

        // Cancel any active flow silently to allow switching
        setFlow({ active: false, action: null, step: null, item: null });

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

    const handleItemSelect = (itemId) => {
        if (!itemId) return;
        const item = allItems.find(i => i.id === itemId);
        setMessages(prev => [...prev, { type: 'user', text: `Selecionei: ${item.name}` }]);
        setFlow({ active: false }); // Pause flow UI
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
                setMessages(prev => [...prev, { type: 'bot', text: `Qual é o novo preço para "${item.name}"? (Atual: ${item.price})` }]);
                setFlow({ active: true, action: 'edit_price', step: 'INPUT_PRICE', item: item });
            } else if (flow.action === 'edit_text') {
                setMessages(prev => [...prev, { type: 'bot', text: `Escreva a nova descrição para "${item.name}":` }]);
                setFlow({ active: true, action: 'edit_text', step: 'INPUT_TEXT', item: item });
            } else if (flow.action === 'new_photo') {
                setMessages(prev => [...prev, { type: 'bot', text: `Faça upload da nova foto para "${item.name}":` }]);
                setFlow({ active: true, action: 'new_photo', step: 'INPUT_PHOTO', item: item });
            } else if (flow.action === 'magic_desc') {
                const prompts = [
                    `Um delicioso prato de ${item.name} preparado cuidadosamente com os ingredientes mais frescos. Irresistível a cada dentada!`,
                    `A nossa especialidade! O ${item.name} tem um sabor autêntico e único, perfeito para tornar a sua refeição inesquecível.`,
                    `Sabor excecional. Peça o seu ${item.name} agora e deixe-se surpreender pela combinação perfeita de aromas.`
                ];
                const magicText = prompts[Math.floor(Math.random() * prompts.length)];

                setMessages(prev => [...prev, { type: 'bot', text: `✨ Sugestão Mágica para "${item.name}":\n\n"${magicText}"` }]);
                setTimeout(() => {
                    setFlow({ active: true, action: 'magic_desc_confirm', step: 'CONFIRM_MAGIC', item: item, data: magicText });
                }, 400);
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
            console.error(e);
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: '❌ Erro ao enviar foto para a Base de Dados.' }]);
        }
    };

    const actionChips = [
        { id: 'edit_price', label: '💰 Mudar Preço', color: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700' },
        { id: 'out_of_stock', label: '🚫 Esgotar Prato', color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-900/50' },
        { id: 'edit_text', label: '📝 Editar Descrição', color: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700' },
        { id: 'new_photo', label: '📷 Trocar Foto', color: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700' },
        { id: 'magic_desc', label: '✨ Descrição Mágica', color: 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 dark:bg-primary/90 dark:text-gray-900 border-none' }
    ];

    return (
        <div className="h-[600px] flex flex-col bg-transparent max-w-4xl mx-auto pb-4">
            {/* Header */}
            <div className="p-6 bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md rounded-t-3xl border border-gray-100 dark:border-gray-800 border-b-0 shadow-sm z-10">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    🤖 Assistente Jindungo
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-8">Seu gerente virtual de restaurante.</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-white/40 dark:bg-[#141414]/40 backdrop-blur-xl border-x border-gray-100 dark:border-gray-800 custom-scrollbar">

                {/* Analytics Widget injected in chat */}
                {allItems.length > 0 && <SimpleAnalytics items={allItems} />}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`p-4 max-w-[85%] shadow-sm text-[0.95rem] leading-relaxed ${msg.type === 'user'
                        ? 'self-end bg-primary text-gray-900 font-medium rounded-2xl rounded-br-sm'
                        : 'self-start bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700'
                        }`}>
                        {msg.text}
                    </div>
                ))}

                {isTyping && (
                    <div className="self-start bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700 w-16 shadow-sm flex justify-center items-center gap-1 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                )}

                {/* Interactive Flow Renders */}
                {flow.active && flow.step === 'SELECT_ITEM' && (
                    <div className="self-start bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-sm border border-gray-100 dark:border-gray-700 w-full max-w-[85%] shadow-sm animate-fade-in">
                        <p className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Selecione o Item na lista:</p>
                        <select
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            onChange={(e) => handleItemSelect(e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>Escolha um prato...</option>
                            {allItems.filter(i => flow.action === 'out_of_stock' ? true : i.available !== false).map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {flow.active && flow.step === 'INPUT_PRICE' && (
                    <div className="self-start bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-sm border border-gray-100 dark:border-gray-700 w-full max-w-[85%] shadow-sm flex flex-col gap-3 animate-fade-in">
                        <input
                            type="text"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            placeholder="Ex: 5000 Kz"
                            id="chat-price-input"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePriceSubmit(e.target.value);
                            }}
                        />
                        <button
                            onClick={() => handlePriceSubmit(document.getElementById('chat-price-input').value)}
                            className="bg-primary text-gray-900 dark:text-white font-bold px-4 py-3 w-full rounded-xl text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                        >
                            Submeter Preço
                        </button>
                    </div>
                )}

                {flow.active && flow.step === 'INPUT_TEXT' && (
                    <div className="self-start bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-sm border border-gray-100 dark:border-gray-700 w-full max-w-[85%] shadow-sm flex flex-col gap-3 animate-fade-in">
                        <textarea
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium resize-y min-h-[100px]"
                            placeholder="Descreva o detalhe..."
                            id="chat-text-input"
                            defaultValue={flow.item?.desc_text || ''}
                            autoFocus
                        />
                        <button
                            onClick={() => handleTextSubmit(document.getElementById('chat-text-input').value)}
                            className="bg-primary text-gray-900 dark:text-white font-bold px-4 py-3 w-full rounded-xl text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                        >
                            Guardar Descrição
                        </button>
                    </div>
                )}

                {flow.active && flow.step === 'INPUT_PHOTO' && (
                    <div className="self-start bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-sm border border-gray-100 dark:border-gray-700 w-full max-w-[85%] shadow-sm animate-fade-in">
                        <input
                            type="file"
                            accept="image/*"
                            id="chat-photo-input"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer mb-3"
                        />
                        <button
                            onClick={() => {
                                const fileInput = document.getElementById('chat-photo-input');
                                if (fileInput.files.length) handlePhotoSubmit(fileInput.files[0]); else alert('Escolha um ficheiro.');
                            }}
                            className="bg-primary text-gray-900 dark:text-white font-bold px-4 py-3 w-full rounded-xl text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                        >
                            Fazer Upload
                        </button>
                    </div>
                )}

                {flow.active && flow.step === 'CONFIRM_MAGIC' && (
                    <div className="self-start flex gap-3 mt-2 mb-4 animate-fade-in">
                        <button
                            onClick={() => handleTextSubmit(flow.data)}
                            className="bg-primary text-gray-900 font-bold px-6 py-2.5 rounded-full text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                        >
                            👍 Sim, Aplicar
                        </button>
                        <button
                            onClick={() => {
                                setMessages(prev => [...prev, { type: 'user', text: "Não gostei. Cancela." }, { type: 'bot', text: 'Entendido. O que deseja fazer a seguir? 🤖' }]);
                                setFlow({ active: false });
                            }}
                            className="bg-gray-200 text-gray-700 font-bold px-6 py-2.5 rounded-full text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                        >
                            👎 Não
                        </button>
                    </div>
                )}

                <div ref={endRef} />
            </div>

            {/* Quick Actions (Bottom) */}
            <div className="p-6 bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md rounded-b-3xl border border-gray-100 dark:border-gray-800 border-t-0 shadow-sm z-10 transition-opacity">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Ações Rápidas</p>
                <div className={`flex flex-wrap gap-2 sm:gap-3 ${isTyping ? 'opacity-50 pointer-events-none' : ''}`}>
                    {actionChips.map(chip => (
                        <button
                            key={chip.id}
                            onClick={() => handleActionClick(chip.id, chip.label)}
                            disabled={isTyping}
                            className={`px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${chip.color}`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatAdminPanel;

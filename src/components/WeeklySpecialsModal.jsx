import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Calendar, Sparkles, Check, Trash2, Clock, ChevronRight, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = [
    { key: '1', name: 'Segunda-feira', short: 'Seg', tag: 'Almoço Executivo' },
    { key: '2', name: 'Terça-feira', short: 'Ter', tag: 'Sabor Tradicional' },
    { key: '3', name: 'Quarta-feira', short: 'Qua', tag: 'Especial da Casa' },
    { key: '4', name: 'Quinta-feira', short: 'Qui', tag: 'Mar & Terra' },
    { key: '5', name: 'Sexta-feira', short: 'Sex', tag: 'Fim de Semana À Vista' },
    { key: '6', name: 'Sábado', short: 'Sáb', tag: 'Churrasco & Convívio' },
    { key: '0', name: 'Domingo', short: 'Dom', tag: 'Almoço Familiar' },
];

const WeeklySpecialsModal = ({ isOpen, onClose, restaurantId, categories = [], initialSchedule = {}, onSaved }) => {
    // initialSchedule: { '1': { itemId: '...', note: '...', customPrice: '...' }, ... }
    const [schedule, setSchedule] = useState({});
    const [activeDayKey, setActiveDayKey] = useState('1');
    const [isSaving, setIsSaving] = useState(false);

    // Mapear todos os itens do restaurante
    const allItems = React.useMemo(() => {
        return categories.flatMap(cat => cat.items || []);
    }, [categories]);

    useEffect(() => {
        if (initialSchedule && typeof initialSchedule === 'object') {
            setSchedule(initialSchedule);
        }
    }, [initialSchedule]);

    if (!isOpen) return null;

    const handleSelectDishForDay = (dayKey, item) => {
        setSchedule(prev => ({
            ...prev,
            [dayKey]: {
                itemId: item.id,
                itemName: item.name,
                itemPrice: item.price,
                imgUrl: item.img_url || item.img,
                note: prev[dayKey]?.note || 'Inclui prato principal e acompanhamentos do dia',
                customPrice: prev[dayKey]?.customPrice || item.price
            }
        }));
    };

    const handleClearDay = (dayKey) => {
        setSchedule(prev => {
            const next = { ...prev };
            delete next[dayKey];
            return next;
        });
    };

    const handleSave = async () => {
        if (!restaurantId) return;
        setIsSaving(true);
        try {
            // 1. Obter business_info atual do restaurante
            const { data: rest, error: fetchErr } = await supabase
                .from('restaurants')
                .select('business_info')
                .eq('id', restaurantId)
                .single();

            if (fetchErr) throw fetchErr;

            const updatedBusinessInfo = {
                ...(rest?.business_info || {}),
                weekly_specials: schedule
            };

            const { error: updateErr } = await supabase
                .from('restaurants')
                .update({ business_info: updatedBusinessInfo })
                .eq('id', restaurantId);

            if (updateErr) throw updateErr;

            toast.success("Ementa semanal dos Pratos do Dia guardada com sucesso! ✨", { icon: '📅' });
            if (onSaved) onSaved(schedule);
            onClose();
        } catch (err) {
            console.error("Erro ao guardar ementa semanal:", err);
            toast.error("Erro ao guardar ementa semanal.");
        } finally {
            setIsSaving(false);
        }
    };

    const currentDayConfig = DAYS.find(d => d.key === activeDayKey) || DAYS[0];
    const scheduledForCurrentDay = schedule[activeDayKey];
    const selectedItemObj = allItems.find(i => i.id === scheduledForCurrentDay?.itemId);

    return (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans">
            <div className="bg-[#121213] border border-[#2A2A2A] rounded-[28px] sm:rounded-[36px] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden">
                
                {/* Header */}
                <div className="bg-[#18181A] px-5 py-4 sm:px-8 sm:py-5 border-b border-[#2A2A2A] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-500 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-serif font-black text-white flex items-center gap-2">
                                <span>Programação Semanal do Prato do Dia</span>
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                                    AUTOMAÇÃO
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400 font-light mt-0.5">
                                Defina os pratos uma única vez. O menu digital mudará automaticamente a cada dia da semana!
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Sub-header: Carrossel dos 7 Dias da Semana */}
                <div className="bg-[#141416] p-3 sm:p-4 border-b border-[#222] flex gap-2 overflow-x-auto scrollbar-hide">
                    {DAYS.map(day => {
                        const hasDish = !!schedule[day.key]?.itemId;
                        const isSelected = activeDayKey === day.key;
                        const isRealToday = new Date().getDay().toString() === day.key;

                        return (
                            <button
                                key={day.key}
                                type="button"
                                onClick={() => setActiveDayKey(day.key)}
                                className={`flex-1 min-w-[95px] p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative border ${
                                    isSelected
                                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105 font-black'
                                        : hasDish
                                            ? 'bg-white/5 text-gray-200 border-[#D4AF37]/40 hover:bg-white/10'
                                            : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
                                }`}
                            >
                                {isRealToday && (
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 rounded-full mb-1 ${
                                        isSelected ? 'bg-black text-[#D4AF37]' : 'bg-[#D4AF37] text-black'
                                    }`}>
                                        HOJE
                                    </span>
                                )}
                                <span className="text-xs font-bold leading-tight">{day.short}</span>
                                <span className={`text-[9px] mt-0.5 truncate max-w-[80px] ${isSelected ? 'text-black/80 font-bold' : hasDish ? 'text-[#D4AF37]' : 'text-gray-600'}`}>
                                    {hasDish ? '✓ Definido' : 'Sem prato'}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar text-left">
                    
                    {/* Status do Dia Ativo */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#18181C] border border-white/10 p-5 rounded-2xl">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                                <Sparkles size={13} /> {currentDayConfig.tag}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-serif font-black text-white mt-1">
                                Prato do Dia de {currentDayConfig.name}
                            </h3>
                            {scheduledForCurrentDay ? (
                                <p className="text-xs text-gray-300 mt-0.5">
                                    Prato selecionado: <strong className="text-[#D4AF37]">{scheduledForCurrentDay.itemName}</strong>
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-0.5 italic">
                                    Nenhum prato associado a este dia. Escolha uma opção do cardápio abaixo.
                                </p>
                            )}
                        </div>

                        {scheduledForCurrentDay && (
                            <button
                                type="button"
                                onClick={() => handleClearDay(activeDayKey)}
                                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Trash2 size={13} /> Remover Prato deste Dia
                            </button>
                        )}
                    </div>

                    {/* Se tiver prato selecionado, opções adicionais (nota do chef, preço especial) */}
                    {scheduledForCurrentDay && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#141416] p-4 rounded-2xl border border-white/5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                                    Preço Especial para {currentDayConfig.short}
                                </label>
                                <input
                                    type="text"
                                    value={scheduledForCurrentDay.customPrice || ''}
                                    onChange={e => setSchedule(prev => ({
                                        ...prev,
                                        [activeDayKey]: { ...prev[activeDayKey], customPrice: e.target.value }
                                    }))}
                                    placeholder="Ex: 5000 Kz"
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                                    Nota / Acompanhamentos Especiais
                                </label>
                                <input
                                    type="text"
                                    value={scheduledForCurrentDay.note || ''}
                                    onChange={e => setSchedule(prev => ({
                                        ...prev,
                                        [activeDayKey]: { ...prev[activeDayKey], note: e.target.value }
                                    }))}
                                    placeholder="Ex: Inclui sopa e bebida de oferta"
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Lista de Pratos do Cardápio para Selecionar com 1 Clique */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                            <Utensils size={14} className="text-[#D4AF37]" /> Selecione o prato do seu cardápio para {currentDayConfig.name}:
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allItems.map(item => {
                                const isThisSelected = scheduledForCurrentDay?.itemId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectDishForDay(activeDayKey, item)}
                                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                                            isThisSelected
                                                ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                                                : 'bg-[#18181A] border-white/5 hover:border-white/20 hover:bg-[#202024]'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10">
                                            {item.img_url ? (
                                                <img src={item.img_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs">🥘</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h5 className={`text-xs font-bold truncate ${isThisSelected ? 'text-[#D4AF37]' : 'text-white'}`}>
                                                {item.name}
                                            </h5>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                {item.price}
                                            </p>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                                            isThisSelected ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/20 text-transparent'
                                        }`}>
                                            <Check size={13} strokeWidth={3} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-[#18181A] px-5 py-4 sm:px-8 sm:py-5 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <p className="text-xs text-gray-500 text-center sm:text-left">
                        O sistema atualizará os pratos automaticamente todos os dias às 00:00.
                    </p>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-black text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'A guardar...' : 'Guardar Ementa Semanal ✨'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WeeklySpecialsModal;

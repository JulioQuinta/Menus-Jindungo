import React, { useState, useMemo } from 'react';
import SmartImage from './SmartImage';
import { Sparkles, Clock, Utensils, Star, Plus, Flame, Check, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { translateFoodText } from '../utils/i18n';
import toast from 'react-hot-toast';

const WEEK_DAYS = [
    { key: '1', short: 'Seg', namePT: 'Segunda-feira', nameEN: 'Monday', nameFR: 'Lundi', nameES: 'Lunes' },
    { key: '2', short: 'Ter', namePT: 'Terça-feira', nameEN: 'Tuesday', nameFR: 'Mardi', nameES: 'Martes' },
    { key: '3', short: 'Qua', namePT: 'Quarta-feira', nameEN: 'Wednesday', nameFR: 'Mercredi', nameES: 'Miércoles' },
    { key: '4', short: 'Qui', namePT: 'Quinta-feira', nameEN: 'Thursday', nameFR: 'Jeudi', nameES: 'Jueves' },
    { key: '5', short: 'Sex', namePT: 'Sexta-feira', nameEN: 'Friday', nameFR: 'Vendredi', nameES: 'Viernes' },
    { key: '6', short: 'Sáb', namePT: 'Sábado', nameEN: 'Saturday', nameFR: 'Samedi', nameES: 'Sábado' },
    { key: '0', short: 'Dom', namePT: 'Domingo', nameEN: 'Sunday', nameFR: 'Dimanche', nameES: 'Domingo' }
];

const DailySpecialShowcase = ({ 
    categories = [], 
    businessInfo = {},
    selectedLanguage = 'PT', 
    primaryColor = '#D4AF37', 
    restaurantClosed = false, 
    onItemAdded,
    onOpenModal 
}) => {
    const { addToCart, getItemQuantity } = useCart();
    
    // JS: 0=Domingo, 1=Segunda, ..., 6=Sábado
    const todayIndex = new Date().getDay();
    const todayKey = String(todayIndex);

    const weeklySpecials = businessInfo?.weekly_specials || {};
    const hasWeeklySchedule = Object.keys(weeklySpecials).length > 0;

    // Estado do dia selecionado (padrão é HOJE)
    const [selectedDayKey, setSelectedDayKey] = useState(todayKey);
    const [activeOptionIndex, setActiveOptionIndex] = useState(0);

    // Mapeamento de todos os itens do cardápio
    const allItems = useMemo(() => {
        return categories.flatMap(cat => cat.items || []);
    }, [categories]);

    // Resolução do prato a exibir com base no dia selecionado ou destaques
    const { currentItem, isFromWeeklySchedule, isViewingToday } = useMemo(() => {
        const viewingToday = selectedDayKey === todayKey;
        const scheduledDayData = weeklySpecials[selectedDayKey];

        // 1. Se existir um prato configurado na ementa semanal para o dia selecionado
        if (scheduledDayData && scheduledDayData.itemId) {
            const foundInMenu = allItems.find(i => i.id === scheduledDayData.itemId);
            if (foundInMenu) {
                return {
                    currentItem: {
                        ...foundInMenu,
                        price: scheduledDayData.customPrice || foundInMenu.price,
                        note: scheduledDayData.note || foundInMenu.desc_text,
                        badge: viewingToday ? 'Prato do Dia' : `Especial de ${WEEK_DAYS.find(d => d.key === selectedDayKey)?.namePT}`
                    },
                    isFromWeeklySchedule: true,
                    isViewingToday: viewingToday
                };
            }

            // Fallback com dados gravados no agendamento se o item não estiver na lista ativa
            return {
                currentItem: {
                    id: scheduledDayData.itemId,
                    name: scheduledDayData.itemName || 'Prato do Dia',
                    price: scheduledDayData.customPrice || scheduledDayData.itemPrice || '3500 Kz',
                    img_url: scheduledDayData.imgUrl,
                    desc_text: scheduledDayData.note || 'Preparado fresco com acompanhamentos especiais do chef.',
                    badge: viewingToday ? 'Prato do Dia' : `Especial de ${WEEK_DAYS.find(d => d.key === selectedDayKey)?.namePT}`
                },
                isFromWeeklySchedule: true,
                isViewingToday: viewingToday
            };
        }

        // 2. Se o dia for hoje e não houver prato semanal, buscar itens com badge 'Prato do Dia' ou is_highlight
        const explicit = allItems.filter(item => {
            if (item.available === false) return false;
            const b = String(item.badge || '').toLowerCase();
            return b.includes('prato do dia') || b.includes('especial do dia');
        });

        if (explicit.length > 0) {
            return {
                currentItem: explicit[activeOptionIndex] || explicit[0],
                isFromWeeklySchedule: false,
                isViewingToday: true
            };
        }

        const highlights = allItems.filter(item => item.available !== false && (item.is_highlight || item.isHighlight));
        if (highlights.length > 0) {
            return {
                currentItem: highlights[activeOptionIndex] || highlights[0],
                isFromWeeklySchedule: false,
                isViewingToday: true
            };
        }

        return { currentItem: null, isFromWeeklySchedule: false, isViewingToday: true };
    }, [weeklySpecials, selectedDayKey, todayKey, allItems, activeOptionIndex]);

    if (!currentItem) return null;

    const currentDayObj = WEEK_DAYS.find(d => d.key === selectedDayKey) || WEEK_DAYS[0];
    const dayLabel = selectedLanguage === 'PT' ? currentDayObj.namePT : (currentDayObj[`name${selectedLanguage}`] || currentDayObj.nameEN);

    const qtyInCart = getItemQuantity(currentItem.id);
    const priceVal = parseInt(String(currentItem.price).replace(/[^0-9]/g, ''), 10) || 0;
    const formattedPrice = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
        .format(priceVal)
        .replace('AOA', 'Kz');

    const displayName = currentItem.translations?.[selectedLanguage.toLowerCase()]?.name 
        || translateFoodText(currentItem.name, selectedLanguage);
    const displayDesc = currentItem.note 
        || currentItem.translations?.[selectedLanguage.toLowerCase()]?.desc 
        || translateFoodText(currentItem.desc_text || currentItem.desc, selectedLanguage);

    const handleQuickAdd = (e) => {
        e.stopPropagation();
        if (restaurantClosed) return;

        if (onOpenModal) {
            onOpenModal(currentItem);
            return;
        }

        addToCart(currentItem);
        toast.success(
            selectedLanguage === 'PT'
                ? `1x ${currentItem.name} (${isViewingToday ? 'Prato do Dia' : 'Sugestão'}) adicionado!`
                : `1x ${currentItem.name} added!`,
            { icon: '⭐', duration: 3000 }
        );
        if (onItemAdded) onItemAdded(currentItem);
    };

    return (
        <section className="px-4 sm:px-6 mb-12 animate-fade-in text-left">
            {/* Header: Título & Badge de Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-500 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping"></span>
                                {isViewingToday 
                                    ? (selectedLanguage === 'PT' ? 'Prato do Dia de Hoje' : 'Today\'s Special')
                                    : (selectedLanguage === 'PT' ? `Especial de ${currentDayObj.short}` : `${currentDayObj.short} Special`)}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden xs:inline">
                                • {dayLabel}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight mt-0.5 drop-shadow-md">
                            {isViewingToday 
                                ? (selectedLanguage === 'PT' ? 'Prato do Dia' : 'Dish of the Day')
                                : (selectedLanguage === 'PT' ? `Ementa de ${dayLabel}` : `${dayLabel} Menu`)}
                        </h2>
                    </div>
                </div>

                {/* Badge explicativa de rotação automática */}
                {hasWeeklySchedule && (
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                        <Calendar size={13} className="text-[#D4AF37]" />
                        <span>Ementa Semanal Programada</span>
                    </div>
                )}
            </div>

            {/* SELETOR SEMANAL DE DIAS (Seg a Dom) */}
            {hasWeeklySchedule && (
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar mb-2">
                    {WEEK_DAYS.map((d) => {
                        const isDayToday = d.key === todayKey;
                        const isSelected = d.key === selectedDayKey;
                        const hasDishForThisDay = Boolean(weeklySpecials[d.key]?.itemId);

                        return (
                            <button
                                key={d.key}
                                onClick={() => {
                                    setSelectedDayKey(d.key);
                                    setActiveOptionIndex(0);
                                }}
                                className={`px-3.5 py-2 rounded-2xl text-xs font-black tracking-wider transition-all flex flex-col items-center gap-0.5 shrink-0 border cursor-pointer ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.45)] scale-105 font-black'
                                        : 'bg-[#141416] text-gray-400 border-white/10 hover:border-[#D4AF37]/50 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-1">
                                    <span className="uppercase text-[11px] font-black">{d.short}</span>
                                    {isDayToday && (
                                        <span className={`text-[9px] px-1 rounded font-extrabold ${
                                            isSelected ? 'bg-black text-[#D4AF37]' : 'bg-[#D4AF37] text-black'
                                        }`}>
                                            HOJE
                                        </span>
                                    )}
                                </div>
                                {hasDishForThisDay && !isSelected && (
                                    <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* HERO CARD DO PRATO DO DIA */}
            <div 
                onClick={() => { if (!restaurantClosed && onOpenModal) onOpenModal(currentItem); }}
                className="group relative bg-gradient-to-b from-[#1E1E22] via-[#141416] to-[#0D0D0E] border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] hover:shadow-[0_25px_70px_rgba(212,175,55,0.25)] transition-all duration-500 overflow-hidden cursor-pointer"
            >
                {/* Glow ambiental dourado */}
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#D4AF37]/15 blur-[70px] pointer-events-none group-hover:bg-[#D4AF37]/25 transition-all duration-700"></div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                    {/* Imagem do Prato com SmartImage */}
                    <div className="w-full md:w-64 lg:w-72 h-52 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden relative shrink-0 shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-700">
                        <SmartImage
                            src={currentItem.img_data || currentItem.img_url || currentItem.img}
                            alt={currentItem.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>

                        {/* Badges sobre a foto */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="bg-[#D4AF37] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                                <Flame size={12} className="text-black fill-black" />
                                {isViewingToday 
                                    ? (selectedLanguage === 'PT' ? 'Destaque de Hoje' : 'Today\'s Highlight') 
                                    : currentDayObj.short}
                            </span>
                        </div>

                        {qtyInCart > 0 && (
                            <div className="absolute top-3 right-3 bg-black text-[#D4AF37] border-2 border-[#D4AF37] text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                                {qtyInCart}
                            </div>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-gray-300">
                            <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                                <Clock size={12} className="text-[#D4AF37]" /> Almoço & Jantar
                            </span>
                            <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 font-bold text-[#D4AF37]">
                                {dayLabel}
                            </span>
                        </div>
                    </div>

                    {/* Detalhes do Prato */}
                    <div className="flex-1 w-full flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center text-[#D4AF37]">
                                    <Star size={13} fill="#D4AF37" />
                                    <Star size={13} fill="#D4AF37" />
                                    <Star size={13} fill="#D4AF37" />
                                    <Star size={13} fill="#D4AF37" />
                                    <Star size={13} fill="#D4AF37" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {isViewingToday
                                        ? (selectedLanguage === 'PT' ? 'Sugestão Principal do Chef' : 'Top Chef Selection')
                                        : (selectedLanguage === 'PT' ? `Especial Programado para ${currentDayObj.namePT}` : `Special for ${currentDayObj.nameEN}`)}
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-white leading-tight group-hover:text-[#D4AF37] transition-colors">
                                {displayName}
                            </h3>

                            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed mt-2.5 line-clamp-3">
                                {displayDesc || (selectedLanguage === 'PT' 
                                    ? 'Preparado fresco com acompanhamentos especiais selecionados pelo nosso Chef.' 
                                    : 'Freshly prepared with special chef side dishes and ingredients.')}
                            </p>

                            {currentItem.composition && (
                                <div className="mt-3 text-xs text-[#D4AF37] font-medium flex items-center gap-1.5 bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl border border-[#D4AF37]/20 w-fit">
                                    <Utensils size={13} />
                                    <span>{currentItem.composition}</span>
                                </div>
                            )}
                        </div>

                        {/* Preço e Botão de Ação */}
                        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                    {selectedLanguage === 'PT' ? 'Preço do Prato do Dia' : 'Special Daily Price'}
                                </span>
                                <span className="text-2xl sm:text-3xl font-serif font-black text-[#D4AF37]">
                                    {formattedPrice}
                                </span>
                            </div>

                            <button
                                onClick={handleQuickAdd}
                                disabled={restaurantClosed}
                                className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] hover:brightness-110 text-black font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                            >
                                <Plus size={16} strokeWidth={3} />
                                <span>
                                    {isViewingToday
                                        ? (selectedLanguage === 'PT' ? 'Pedir Prato do Dia ✨' : 'Order Today\'s Special ✨')
                                        : (selectedLanguage === 'PT' ? `Pedir (${currentDayObj.short}) ✨` : `Order (${currentDayObj.short}) ✨`)}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DailySpecialShowcase;

import React, { useState } from 'react';
import SmartImage from './SmartImage';
import { Sparkles, Clock, Utensils, Star, Plus, Flame, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getTranslation, translateFoodText } from '../utils/i18n';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = {
    PT: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
    EN: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    FR: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    ES: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
};

const DailySpecialShowcase = ({ 
    categories = [], 
    selectedLanguage = 'PT', 
    primaryColor = '#D4AF37', 
    restaurantClosed = false, 
    onItemAdded,
    onOpenModal 
}) => {
    const { addToCart, getItemQuantity } = useCart();
    const todayIndex = new Date().getDay();
    const todayName = (DAYS_OF_WEEK[selectedLanguage] || DAYS_OF_WEEK['PT'])[todayIndex];

    // Recolher todos os itens das categorias
    const allItems = React.useMemo(() => {
        return categories.flatMap(cat => cat.items || []);
    }, [categories]);

    // Filtrar os pratos do dia (badge 'Prato do Dia', ou is_highlight)
    const dailySpecials = React.useMemo(() => {
        const explicit = allItems.filter(item => {
            if (item.available === false) return false;
            const b = String(item.badge || '').toLowerCase();
            return b.includes('prato do dia') || b.includes('especial do dia');
        });

        if (explicit.length > 0) return explicit;

        // Fallback: itens com is_highlight ativo
        const highlights = allItems.filter(item => item.available !== false && (item.is_highlight || item.isHighlight));
        return highlights.slice(0, 3);
    }, [allItems]);

    const [activeIndex, setActiveIndex] = useState(0);

    if (dailySpecials.length === 0) return null;

    const currentItem = dailySpecials[activeIndex] || dailySpecials[0];
    const qtyInCart = getItemQuantity(currentItem.id);

    const priceVal = parseInt(String(currentItem.price).replace(/[^0-9]/g, ''), 10) || 0;
    const formattedPrice = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
        .format(priceVal)
        .replace('AOA', 'Kz');

    const displayName = currentItem.translations?.[selectedLanguage.toLowerCase()]?.name 
        || translateFoodText(currentItem.name, selectedLanguage);
    const displayDesc = currentItem.translations?.[selectedLanguage.toLowerCase()]?.desc 
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
                ? `1x ${currentItem.name} (Prato do Dia) adicionado!`
                : `1x ${currentItem.name} (Special) added!`,
            { icon: '⭐', duration: 3000 }
        );
        if (onItemAdded) onItemAdded(currentItem);
    };

    return (
        <section className="px-4 sm:px-6 mb-12 animate-fade-in text-left">
            {/* Header com badge de dia */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-500 text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping"></span>
                                {selectedLanguage === 'PT' ? 'Sugestão do Chef' : 'Chef\'s Special'}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden xs:inline">
                                • {todayName}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-black text-white leading-tight mt-0.5 drop-shadow-md">
                            {selectedLanguage === 'PT' ? 'Prato do Dia' : 'Dish of the Day'}
                        </h2>
                    </div>
                </div>

                {/* Seletor se houver mais de 1 prato do dia (ex: Carne e Peixe) */}
                {dailySpecials.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-[#141416] p-1 rounded-2xl border border-white/10 shadow-inner">
                        {dailySpecials.map((spec, idx) => (
                            <button
                                key={spec.id || idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    activeIndex === idx
                                        ? 'bg-[#D4AF37] text-black shadow-md font-black scale-105'
                                        : 'text-gray-400 hover:text-white bg-white/5'
                                }`}
                            >
                                {idx === 0 ? 'Opção 1' : idx === 1 ? 'Opção 2' : `Opção ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hero Card do Prato do Dia */}
            <div 
                onClick={() => { if (!restaurantClosed && onOpenModal) onOpenModal(currentItem); }}
                className="group relative bg-gradient-to-b from-[#1E1E22] via-[#141416] to-[#0D0D0E] border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] hover:shadow-[0_25px_70px_rgba(212,175,55,0.25)] transition-all duration-500 overflow-hidden cursor-pointer"
            >
                {/* Glow ambiental no canto */}
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#D4AF37]/15 blur-[70px] pointer-events-none group-hover:bg-[#D4AF37]/25 transition-all duration-700"></div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                    {/* Imagem do Prato em Alta Resolução */}
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
                                {selectedLanguage === 'PT' ? 'Hoje' : 'Today'}
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
                                    {selectedLanguage === 'PT' ? 'Recomendação Máxima' : 'Top Chef Selection'}
                                </span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-white leading-tight group-hover:text-[#D4AF37] transition-colors">
                                {displayName}
                            </h3>

                            <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed mt-2.5 line-clamp-3">
                                {displayDesc || (selectedLanguage === 'PT' 
                                    ? 'Preparado fresco hoje pelo nosso Chef com os melhores ingredientes locais.' 
                                    : 'Freshly prepared today by our Chef with selected premium ingredients.')}
                            </p>

                            {currentItem.composition && (
                                <div className="mt-3 text-xs text-[#D4AF37] font-medium flex items-center gap-1.5 bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl border border-[#D4AF37]/20 w-fit">
                                    <Utensils size={13} />
                                    <span>{currentItem.composition}</span>
                                </div>
                            )}
                        </div>

                        {/* Preço e Botão de Ação Imediata */}
                        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                                    {selectedLanguage === 'PT' ? 'Preço Especial' : 'Special Price'}
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
                                <span>{selectedLanguage === 'PT' ? 'Pedir Prato do Dia ✨' : 'Order Special ✨'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DailySpecialShowcase;

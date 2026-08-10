import React, { useState, useEffect } from 'react';
import SmartImage from './SmartImage';
import Skeleton from './Skeleton';
import { Plus, Minus, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getTranslation, translateFoodText } from '../utils/i18n';
import toast from 'react-hot-toast';

const kzAOFormatter = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' });

const isItemSoldOut = (item) => {
    return item?.available === false || (item?.track_stock && (item?.stock_quantity === null || item?.stock_quantity <= 0));
};

// Helper for dark mode conditional styles
const getCardStyle = (darkMode, customBg) => {
    if (customBg?.isCustom) {
        return customBg.textColor === '#ffffff' ? 'bg-black/30 border-white/10 backdrop-blur-md' : 'bg-white/70 border-gray-800/10 backdrop-blur-md';
    }
    return darkMode ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100';
};
const getTextStyle = (darkMode, customBg) => {
    if (customBg?.isCustom) {
        return customBg.textColor === '#ffffff' ? 'text-white' : 'text-gray-900';
    }
    return darkMode ? 'text-gray-100' : 'text-gray-900';
};
const getSubTextStyle = (darkMode, customBg) => {
    if (customBg?.isCustom) {
        return customBg.textColor === '#ffffff' ? 'text-gray-300' : 'text-gray-600';
    }
    return darkMode ? 'text-gray-400' : 'text-gray-500';
};

const getTrans = (item, lang, field) => {
    if (item?.translations && item.translations[lang.toLowerCase()] && item.translations[lang.toLowerCase()][field]) {
        return item.translations[lang.toLowerCase()][field];
    }
    const originalText = item?.[field];
    if (field === 'name' || field === 'desc' || field === 'composition') {
        return translateFoodText(originalText, lang);
    }
    return originalText;
};

const getCompositionStyle = (darkMode, customBg) => {
    if (customBg?.isCustom) {
        if (customBg.textColor === '#ffffff') return 'text-[#F9BF00] font-semibold';
        return 'text-[#1a1a1a] font-medium'; 
    }
    return darkMode ? 'text-[#F9BF00] font-semibold' : 'text-[#3E2723] font-medium';
};

// [NEW] Premium Bottom Sheet Customization Modal (Glovo / UberEats Style)
const CustomizationBottomSheet = ({ item, isOpen, onClose, primaryColor, darkMode, selectedLanguage, onItemAdded }) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedOptions, setSelectedOptions] = useState({});

    const hasVariants = Array.isArray(item?.translations?.variants) && item.translations.variants.length > 0;
    const existingGroups = React.useMemo(() => {
        return Array.isArray(item?.translations?.customization_groups) ? item.translations.customization_groups : [];
    }, [item?.translations?.customization_groups]);

    const groups = React.useMemo(() => {
        if (!item) return [];
        let generated = [...existingGroups];
        if (generated.length === 0) {
            if (hasVariants) {
                generated.push({
                    id: 'var',
                    title: getTranslation(selectedLanguage, 'chooseOption'),
                    required: true,
                    min: 1,
                    max: 1,
                    options: item.translations.variants.map(v => ({ name: v, price: 0 }))
                });
            }
            generated.push({
                id: 'extras',
                title: getTranslation(selectedLanguage, 'extras'),
                subtitle: getTranslation(selectedLanguage, 'customizeOrder'),
                required: false,
                min: 0,
                max: 3,
                options: [
                    { name: 'Molho de Jindungo Extra', price: 500 },
                    { name: 'Batata Frita Rústica', price: 1500 },
                    { name: 'Arroz Branco Soltinho', price: 1200 },
                    { name: 'Bacon Crocante', price: 800 },
                    { name: 'Ovo Estrelado', price: 500 },
                ]
            });
        }
        return generated;
    }, [item, existingGroups, hasVariants, selectedLanguage]);

    useEffect(() => {
        if (isOpen && item?.id) {
            const initial = {};
            groups.forEach(g => {
                if (g.required && g.options?.[0]) {
                    initial[g.id] = [g.options[0].name];
                } else {
                    initial[g.id] = [];
                }
            });
            setSelectedOptions(initial);
            setQuantity(1);
            setNotes('');
        }
    }, [isOpen, item?.id]);

    const handleOptionToggle = (groupId, option, max) => {
        setSelectedOptions(prev => {
            const current = prev[groupId] || [];
            if (max === 1) {
                return { ...prev, [groupId]: [option.name] };
            }
            if (current.includes(option.name)) {
                return { ...prev, [groupId]: current.filter(n => n !== option.name) };
            }
            if (current.length >= max) {
                const maxErr = getTranslation(selectedLanguage, 'maxOptionsError');
                const optWord = selectedLanguage === 'PT' ? 'opções' : (selectedLanguage === 'FR' ? 'options' : (selectedLanguage === 'ES' ? 'opciones' : 'options'));
                toast.error(`${maxErr} ${max} ${optWord}.`);
                return prev;
            }
            return { ...prev, [groupId]: [...current, option.name] };
        });
    };

    const basePriceNum = parseInt(String(item?.price || 0).replace(/[^0-9]/g, ''), 10) || 0;
    const extrasTotal = React.useMemo(() => {
        if (!item || !groups.length) return 0;
        let total = 0;
        Object.entries(selectedOptions).forEach(([groupId, names]) => {
            const grp = groups.find(g => g.id === groupId);
            if (!grp) return;
            names.forEach(name => {
                const opt = grp.options?.find(o => o.name === name);
                if (opt && opt.price) total += parseInt(String(opt.price).replace(/[^0-9]/g, ''), 10) || 0;
            });
        });
        return total;
    }, [item, groups, selectedOptions]);

    const finalItemPrice = basePriceNum + extrasTotal;
    const totalOrderValue = finalItemPrice * quantity;

    const handleAddToCart = () => {
        for (const g of groups) {
            const sel = selectedOptions[g.id] || [];
            if (g.required && sel.length < (g.min || 1)) {
                const reqErr = getTranslation(selectedLanguage, 'selectRequiredError');
                toast.error(`${reqErr}: ${g.title}`);
                return;
            }
        }

        let parts = [];
        Object.entries(selectedOptions).forEach(([groupId, names]) => {
            const grp = groups.find(g => g.id === groupId);
            if (!grp) return;
            names.forEach(name => {
                const opt = grp.options?.find(o => o.name === name);
                if (opt && Number(opt.price) > 0) {
                    parts.push(`${name} (+${kzAOFormatter.format(opt.price).replace('AOA', 'Kz')})`);
                } else {
                    parts.push(name);
                }
            });
        });

        const variantString = parts.filter(Boolean).join(' | ') || null;
        const notesString = notes.trim() ? notes.trim() : null;

        const itemToStore = {
            ...item,
            price: finalItemPrice,
            variant_name: variantString,
            notes: notesString
        };

        for (let i = 0; i < quantity; i++) {
            addToCart(itemToStore, variantString);
        }

        toast.success(
            selectedLanguage === 'PT'
                ? `${quantity}x ${item.name} adicionado!`
                : `${quantity}x ${item.name} added!`,
            { icon: '🎒', duration: 3000 }
        );
        if (onItemAdded) onItemAdded(item);
        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col justify-end animate-fade-in p-0 sm:p-6 sm:justify-center items-center"
            onClick={onClose}
        >
            <div 
                className={`w-full max-w-lg bg-white dark:bg-[#1C1C1C] rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-slide-up sm:animate-fade-in border border-gray-100 dark:border-gray-800 relative`}
                onClick={e => e.stopPropagation()}
            >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3 shrink-0 sm:hidden" />
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                    <X size={20} />
                </button>

                {/* Hero Image */}
                <div className="h-40 sm:h-64 w-full relative shrink-0 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <SmartImage src={item.img_data || item.img_url || item.img} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 text-white">
                        <h2 className="text-2xl sm:text-3xl font-serif font-black leading-tight drop-shadow-md">{getTrans(item, selectedLanguage, 'name')}</h2>
                        <p className="text-sm text-gray-200 line-clamp-2 font-light mt-1 drop-shadow">{getTrans(item, selectedLanguage, 'desc')}</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar text-left relative z-10">
                    {groups.map((group, gIdx) => {
                        const selected = selectedOptions[group.id] || [];
                        const t = (key) => getTranslation(selectedLanguage, key);
                        return (
                            <div key={group.id || gIdx} className="space-y-3">
                                <div className="flex justify-between items-baseline border-b pb-2 dark:border-gray-800/80">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {group.title}
                                            {group.required && <span className="text-xs bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded-md border border-amber-500/20">{t('obligatory')}</span>}
                                        </h3>
                                        {group.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{group.subtitle}</p>}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400">
                                        {group.max === 1 
                                            ? (selectedLanguage === 'PT' ? 'Escolha 1' : (selectedLanguage === 'FR' ? 'Choisissez 1' : (selectedLanguage === 'ES' ? 'Elija 1' : 'Choose 1'))) 
                                            : (selectedLanguage === 'PT' ? 'Até ' : (selectedLanguage === 'FR' ? 'Jusqu\'à ' : (selectedLanguage === 'ES' ? 'Hasta ' : 'Up to '))) + group.max}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {group.options?.map((opt, oIdx) => {
                                        const isChecked = selected.includes(opt.name);
                                        return (
                                            <button
                                                key={oIdx}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleOptionToggle(group.id, opt, group.max); }}
                                                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border text-left cursor-pointer active:scale-[0.99] ${
                                                    isChecked 
                                                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md' 
                                                        : 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-${group.max === 1 ? 'full' : 'md'} border flex items-center justify-center transition-all ${
                                                        isChecked 
                                                            ? 'bg-amber-500 border-amber-500 text-black font-black' 
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                    }`}>
                                                        {isChecked && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                    <span className={`text-sm sm:text-base font-medium ${isChecked ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {opt.name}
                                                    </span>
                                                </div>
                                                {Number(opt.price) > 0 && (
                                                    <span className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                                                        +{kzAOFormatter.format(opt.price).replace('AOA', 'Kz')}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div className="space-y-2 pt-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{getTranslation(selectedLanguage, 'specialNotes')}</h3>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={getTranslation(selectedLanguage, 'specialNotesPlaceholder')}
                            rows={2}
                            className="w-full rounded-2xl p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-gray-400 resize-none transition-all"
                        />
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-[#1C1C1C] border-t border-gray-100 dark:border-gray-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] flex items-center gap-4 shrink-0 relative z-50">
                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQuantity(q => Math.max(1, q - 1)); }}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                            disabled={quantity <= 1}
                        >
                            <Minus size={18} />
                        </button>
                        <span className="text-lg font-black w-8 text-center text-gray-900 dark:text-white">{quantity}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQuantity(q => q + 1); }}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                        className="flex-1 py-4 px-6 rounded-2xl font-black text-black bg-[#D4AF37] shadow-[0_8px_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-between group overflow-hidden relative cursor-pointer"
                    >
                        <span className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
                        <span className="text-base sm:text-lg font-bold">{getTranslation(selectedLanguage, 'addToCart')}</span>
                        <span className="bg-black/10 px-3 py-1 rounded-xl text-sm sm:text-base font-black">
                            {kzAOFormatter.format(totalOrderValue).replace('AOA', 'Kz')}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const MenuItemList = ({ item, primaryColor, isEditing, darkMode, selectedLanguage, customBgInfo, restaurantClosed, onItemAdded, onOpenModal }) => {
    const { getItemQuantity } = useCart();
    const quantityInCart = getItemQuantity(item.id);
    const composition = getTrans(item, selectedLanguage, 'composition');
    const t = (key) => getTranslation(selectedLanguage, key);

    const isSoldOut = isItemSoldOut(item);

    return (
        <div
            onClick={() => { if (!isEditing && !restaurantClosed) onOpenModal(); }}
            className={`rounded-2xl sm:rounded-3xl shadow-sm border p-2.5 sm:p-4.5 flex gap-3 sm:gap-4 transition-all duration-300 animate-fade-in-up group relative overflow-hidden cursor-pointer active:scale-[0.99] ${getCardStyle(darkMode, customBgInfo)}
                ${isSoldOut ? 'opacity-85 hover:border-[#D4AF37]/30' : 'hover:shadow-xl hover:border-[#D4AF37]/50'}
            `}
        >
            <div className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 rounded-[14px] sm:rounded-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-500 shadow-md">
                <SmartImage
                    src={item.img_data || item.img_url || item.img}
                    alt={item.name}
                    className="w-full h-full object-cover"
                />
                {item.isHighlight && (
                    <span className="absolute top-2 left-2 bg-[#D4AF37] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 tracking-widest uppercase border border-white/20">
                        ★ {t('highlight')}
                    </span>
                )}
                {quantityInCart > 0 && (
                    <div className="absolute top-2 right-2 bg-black text-[#D4AF37] border-2 border-[#D4AF37] text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-2xl z-20 animate-bounce">
                        {quantityInCart}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                    <h3 className={`font-serif font-black text-base sm:text-xl leading-tight ${getTextStyle(darkMode, customBgInfo)}`}>
                        {getTrans(item, selectedLanguage, 'name')}
                    </h3>
                    <p className={`text-xs sm:text-sm line-clamp-2 mt-1 font-light leading-relaxed ${getSubTextStyle(darkMode, customBgInfo)}`}>
                        {getTrans(item, selectedLanguage, 'desc')}
                    </p>
                    {composition && (
                        <div className={`text-[11px] italic mt-1.5 opacity-80 font-medium ${getCompositionStyle(darkMode, customBgInfo)}`}>
                            ✨ {composition}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="font-black text-base sm:text-lg tracking-tight" style={{ color: primaryColor }}>
                        {kzAOFormatter.format(parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0)}
                    </span>

                    {isSoldOut ? (
                        <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                            {t('soldOut')}
                        </div>
                    ) : restaurantClosed ? (
                        <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500">
                            {t('suspended')}
                        </div>
                    ) : !isEditing ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
                            className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-black shadow-[0_4px_15px_rgba(212,175,55,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group/btn relative overflow-hidden"
                            title={t('addToCart')}
                        >
                            <span className="absolute inset-0 bg-white/25 opacity-0 group-active/btn:opacity-100 transition-opacity" />
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const MenuItemGrid = ({ item, primaryColor, isEditing, darkMode, selectedLanguage, customBgInfo, restaurantClosed, onItemAdded, onOpenModal }) => {
    const { getItemQuantity } = useCart();
    const quantityInCart = getItemQuantity(item.id);
    const composition = getTrans(item, selectedLanguage, 'composition');
    const t = (key) => getTranslation(selectedLanguage, key);

    const isSoldOut = isItemSoldOut(item);

    const formattedPrice = kzAOFormatter
        .format(parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0)
        .replace('AOA', 'Kz')
        .trim();

    return (
        <div
            onClick={() => { if (!isEditing && !restaurantClosed) onOpenModal(); }}
            className={`rounded-2xl sm:rounded-[28px] shadow-[0_8px_25px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden border flex flex-col h-full group relative cursor-pointer active:scale-[0.99] bg-[#141414] border-[#262626] hover:border-[#E5C27B]/60 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)] ${
                isSoldOut ? 'opacity-85' : ''
            }`}
        >
            {/* Top Image Container matching screenshot */}
            <div className="relative h-28 sm:h-44 w-full overflow-hidden rounded-t-2xl sm:rounded-t-[28px] bg-[#1C1C1C] shadow-inner">
                <SmartImage
                    src={item.img_data || item.img_url || item.img}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-80"></div>
                
                {item.isHighlight && (
                    <span className="absolute top-2.5 left-2.5 bg-[#E5C27B] text-gray-950 text-[8px] sm:text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg z-10 tracking-widest uppercase border border-amber-300/40">
                        ★ {t('highlight')}
                    </span>
                )}
                
                {quantityInCart > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C27B] to-[#C59B27] text-gray-950 border border-white/20 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-2xl z-20 animate-bounce">
                        {quantityInCart}
                    </div>
                )}

                {/* International Standard: Floating Add Button (UberEats & Glovo style) */}
                {!restaurantClosed && !isEditing && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
                        className="absolute bottom-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#E5C27B] to-[#C59B27] text-gray-950 flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(229,194,123,0.5)] hover:scale-110 active:scale-95 transition-all"
                        title={t('addToCart')}
                    >
                        <Plus size={14} strokeWidth={3.5} />
                    </button>
                )}

                {/* Sold Out Overlay */}
                {isSoldOut && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
                        <span className="bg-red-500/95 text-white text-[8px] sm:text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full shadow-lg border border-red-400/20">
                            {t('soldOut')}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Text Area matching screenshot */}
            <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between bg-[#141414]">
                <div>
                    <h3 className="font-serif font-bold text-[13px] sm:text-base leading-snug text-[#EAEAEC] mb-1 group-hover:text-[#E5C27B] transition-colors">
                        {getTrans(item, selectedLanguage, 'name')}
                    </h3>
                    <p className="text-[11px] sm:text-xs font-light leading-relaxed text-[#8E8E93] line-clamp-2">
                        {getTrans(item, selectedLanguage, 'desc')}
                    </p>
                    {composition && (
                        <div className="text-[10px] sm:text-[11px] italic text-[#E5C27B]/80 mt-1.5 font-medium">
                            ✨ {composition}
                        </div>
                    )}
                </div>

                {/* Clean Bottom Price Bar (UberEats / Glovo style) */}
                <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-[#E5C27B] tracking-wide">
                        {formattedPrice}
                    </span>
                    {restaurantClosed && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">
                            {t('suspended')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const GridLayout = ({ items = [], ...props }) => {
    const [selectedModalItem, setSelectedModalItem] = useState(null);
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                {items.map(item => (
                    <MenuItemGrid key={item.id} item={item} onOpenModal={() => setSelectedModalItem(item)} {...props} />
                ))}
            </div>
            <CustomizationBottomSheet
                item={selectedModalItem}
                isOpen={!!selectedModalItem}
                onClose={() => setSelectedModalItem(null)}
                primaryColor={props.primaryColor}
                darkMode={props.darkMode}
                selectedLanguage={props.selectedLanguage}
                onItemAdded={props.onItemAdded}
            />
        </>
    );
};

export const ListLayout = ({ items = [], ...props }) => {
    const [selectedModalItem, setSelectedModalItem] = useState(null);
    return (
        <>
            <div className="flex flex-col gap-4">
                {items.map(item => (
                    <MenuItemList key={item.id} item={item} onOpenModal={() => setSelectedModalItem(item)} {...props} />
                ))}
            </div>
            <CustomizationBottomSheet
                item={selectedModalItem}
                isOpen={!!selectedModalItem}
                onClose={() => setSelectedModalItem(null)}
                primaryColor={props.primaryColor}
                darkMode={props.darkMode}
                selectedLanguage={props.selectedLanguage}
                onItemAdded={props.onItemAdded}
            />
        </>
    );
};

export const MinimalLayout = ({ items = [], primaryColor, fontFamily, isEditing, darkMode, selectedLanguage = 'PT', customBgInfo, restaurantClosed, onItemAdded }) => {
    const [selectedModalItem, setSelectedModalItem] = useState(null);
    const { getItemQuantity } = useCart();
    const t = (key) => getTranslation(selectedLanguage, key);

    return (
        <>
            <div className={`flex flex-col divide-y divide-dashed ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                {items.map(item => {
                    const quantityInCart = getItemQuantity(item.id);
                    const isSoldOut = isItemSoldOut(item);
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => { if (!isEditing && !restaurantClosed) setSelectedModalItem(item); }}
                            className={`py-4 flex justify-between items-center gap-4 rounded-2xl px-4 transition-all duration-300 group animate-fade-in-up cursor-pointer active:scale-[0.99]
                                ${isSoldOut ? 'opacity-85' : 'hover:bg-white/5'}
                            `}
                        >
                            <div className="flex-1 pr-3">
                                <div className="flex items-baseline justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-serif font-bold text-base sm:text-lg group-hover:text-amber-500 transition-colors ${getTextStyle(darkMode, customBgInfo)}`}>
                                            {getTrans(item, selectedLanguage, 'name')}
                                        </h3>
                                        {quantityInCart > 0 && (
                                            <span className="bg-black text-[#D4AF37] border border-[#D4AF37] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                                                {quantityInCart}x
                                            </span>
                                        )}
                                    </div>
                                    <div className={`flex-1 mx-4 border-b border-dotted h-4 opacity-30 hidden sm:block ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                                    <span className="font-black text-base sm:text-lg whitespace-nowrap" style={{ color: primaryColor }}>
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0)}
                                    </span>
                                </div>
                                {item.desc && (
                                    <p className={`text-xs line-clamp-2 font-light leading-relaxed ${getSubTextStyle(darkMode, customBgInfo)}`}>
                                        {getTrans(item, selectedLanguage, 'desc')}
                                    </p>
                                )}
                            </div>

                            <div>
                                {isSoldOut ? (
                                    <span className="text-[10px] font-bold text-red-500 uppercase bg-red-500/10 px-2.5 py-1 rounded-lg">{t('soldOut')}</span>
                                ) : restaurantClosed ? (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-500/10 px-2.5 py-1 rounded-lg">{t('suspended')}</span>
                                ) : !isEditing ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedModalItem(item); }}
                                        className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                                        title={t('addToCart')}
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            <CustomizationBottomSheet
                item={selectedModalItem}
                isOpen={!!selectedModalItem}
                onClose={() => setSelectedModalItem(null)}
                primaryColor={primaryColor}
                darkMode={darkMode}
                selectedLanguage={selectedLanguage}
                onItemAdded={onItemAdded}
            />
        </>
    );
};

export const GridLayoutSkeleton = ({ darkMode }) => (
    <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`rounded-xl overflow-hidden border ${darkMode ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'} h-64`}>
                <Skeleton height="120px" darkMode={darkMode} className="rounded-none" />
                <div className="p-5 space-y-4">
                    <Skeleton height="24px" width="70%" darkMode={darkMode} />
                    <div className="space-y-2">
                        <Skeleton height="14px" width="100%" darkMode={darkMode} />
                        <Skeleton height="14px" width="60%" darkMode={darkMode} />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const ListLayoutSkeleton = ({ darkMode }) => (
    <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`rounded-2xl border p-3 flex gap-4 h-32 ${darkMode ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'}`}>
                <Skeleton width="128px" height="100%" darkMode={darkMode} className="rounded-xl" />
                <div className="flex-1 py-1 space-y-3">
                    <div className="flex justify-between items-start">
                        <Skeleton height="20px" width="50%" darkMode={darkMode} />
                        <Skeleton height="20px" width="20%" darkMode={darkMode} />
                    </div>
                    <Skeleton height="14px" width="90%" darkMode={darkMode} />
                    <Skeleton height="14px" width="70%" darkMode={darkMode} />
                </div>
            </div>
        ))}
    </div>
);

export const MinimalLayoutSkeleton = ({ darkMode }) => (
    <div className="flex flex-col divide-y divide-dashed divide-gray-200">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="py-5 flex justify-between items-center gap-4 px-3">
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-baseline">
                        <Skeleton height="20px" width="40%" darkMode={darkMode} />
                        <Skeleton height="20px" width="15%" darkMode={darkMode} />
                    </div>
                    <Skeleton height="12px" width="60%" darkMode={darkMode} />
                </div>
            </div>
        ))}
    </div>
);

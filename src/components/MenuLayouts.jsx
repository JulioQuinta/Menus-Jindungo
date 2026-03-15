import React from 'react';
import SmartImage from './SmartImage';
import Skeleton from './Skeleton';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const QuantityControls = ({ item, isEditing, primaryColor, darkMode, restaurantClosed }) => {
    const { getItemQuantity, addToCart, removeFromCart } = useCart();
    const quantity = getItemQuantity(item.id);
    const [showVariants, setShowVariants] = React.useState(false);

    const hasVariants = Array.isArray(item.translations?.variants) && item.translations.variants.length > 0;

    if (isEditing) return null;

    if (item.available === false) {
        return (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${darkMode ? 'bg-red-900/40 text-red-400 border border-red-800/50' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                <span className="text-[10px]">🚫</span> Esgotado
            </div>
        );
    }

    if (restaurantClosed) {
        return (
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                Pedidos Suspensos
            </div>
        );
    }

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (hasVariants) {
            setShowVariants(true);
        } else {
            addToCart(item);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 shadow-sm border border-gray-100">
                <button
                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm hover:bg-gray-100 disabled:opacity-30 transition-all duration-200 active:scale-90"
                    disabled={quantity === 0}
                >
                    <Minus size={18} />
                </button>
                <span className="font-bold text-gray-800 min-w-[28px] text-center text-lg">{quantity}</span>
                <button
                    onClick={handleAddClick}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-lg hover:brightness-110 transition-all duration-200 active:scale-90 active:shadow-inner relative group overflow-hidden"
                    style={{ backgroundColor: primaryColor }}
                >
                    {/* Haptic Glow Effect */}
                    <span className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>

            {/* Variants Modal */}
            {showVariants && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] flex flex-col justify-end sm:justify-center items-center p-4 sm:p-0"
                    onClick={(e) => { e.stopPropagation(); setShowVariants(false); }}
                >
                    <div
                        className={`w-full max-w-sm rounded-[2rem] sm:rounded-3xl p-6 ${darkMode ? 'bg-[#1a1a1a] border border-gray-800' : 'bg-white'} shadow-2xl transform transition-all animate-slide-up sm:animate-fade-in`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden" />

                        <h3 className={`text-xl font-bold mb-2 ${getTextStyle(darkMode)}`}>Escolha uma opção</h3>
                        <p className={`text-sm mb-6 ${getSubTextStyle(darkMode)}`}>{item.name}</p>

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                            {item.translations.variants.map((v, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item, v);
                                        setShowVariants(false);
                                    }}
                                    className={`w-full px-5 py-4 rounded-2xl font-semibold text-left transition-all ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800 text-gray-200' : 'bg-gray-50 hover:bg-gray-100/80 text-gray-800 border border-gray-100 hover:border-gray-200'} active:scale-[0.98] flex justify-between items-center`}
                                >
                                    <span>{v}</span>
                                    <Plus size={18} className="text-gray-400" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); setShowVariants(false); }}
                            className={`w-full mt-6 py-4 rounded-2xl font-bold ${darkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

// Helper for dark mode conditional styles - now supporting custom background overrides
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

// [NEW] Helper to get translated text
const getTrans = (item, lang, field) => {
    if (!item.translations || !item.translations[lang.toLowerCase()]) return item[field];
    return item.translations[lang.toLowerCase()][field] || item[field];
};

export const GridLayout = ({ items = [], primaryColor, isEditing, darkMode, selectedLanguage = 'PT', customBgInfo, restaurantClosed }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
                <div
                    key={item.id}
                    className={`rounded-xl shadow-lg transition-all duration-300 overflow-hidden border flex flex-col h-full group animate-fade-in-up ${getCardStyle(darkMode, customBgInfo)} hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/50`}
                    style={{ boxShadow: darkMode ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                >
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                        <SmartImage
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                        {item.isHighlight && (
                            <span className="absolute top-3 left-3 bg-[#D4AF37] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 tracking-widest uppercase border border-white/20">
                                ★ Destaque
                            </span>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col justify-between relative">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-xl leading-tight line-clamp-2 ${getTextStyle(darkMode, customBgInfo)}`}>
                                    {getTrans(item, selectedLanguage, 'name')}
                                </h3>
                                <span className="font-bold text-lg whitespace-nowrap ml-2" style={{ color: primaryColor }}>
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(String(item.price).replace(/[^0-9.]/g, '')) || 0)}
                                </span>
                            </div>
                            <p className={`text-sm line-clamp-2 mb-4 font-light ${getSubTextStyle(darkMode, customBgInfo)}`}>
                                {getTrans(item, selectedLanguage, 'desc')}
                            </p>
                        </div>

                        <div className="flex justify-end mt-2 pt-4 border-t border-dashed border-gray-700/20">
                            <QuantityControls item={item} isEditing={isEditing} primaryColor={primaryColor} darkMode={darkMode} restaurantClosed={restaurantClosed} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ListLayout = ({ items = [], primaryColor, isEditing, darkMode, selectedLanguage = 'PT', customBgInfo, restaurantClosed }) => {
    return (
        <div className="flex flex-col gap-4">
            {items.map(item => (
                <div
                    key={item.id}
                    className={`rounded-2xl shadow-sm border p-3 flex gap-4 transition-all hover:shadow-lg hover:translate-x-1 animate-fade-in-up ${getCardStyle(darkMode, customBgInfo)}`}
                >
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden relative group">
                        <SmartImage
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className={`font-bold text-lg leading-tight ${getTextStyle(darkMode, customBgInfo)}`}>
                                    {getTrans(item, selectedLanguage, 'name')}
                                </h3>
                                <span className="font-bold text-sm sm:text-base whitespace-nowrap ml-2" style={{ color: primaryColor }}>
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(String(item.price).replace(/[^0-9.]/g, '')) || 0)}
                                </span>
                            </div>
                            <p className={`text-xs sm:text-sm line-clamp-2 mt-1 font-light ${getSubTextStyle(darkMode, customBgInfo)}`}>
                                {getTrans(item, selectedLanguage, 'desc')}
                            </p>
                        </div>

                        <div className="flex justify-end mt-2">
                            <QuantityControls item={item} isEditing={isEditing} primaryColor={primaryColor} darkMode={darkMode} restaurantClosed={restaurantClosed} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const MinimalLayout = ({ items = [], primaryColor, fontFamily, isEditing, darkMode, selectedLanguage = 'PT', customBgInfo, restaurantClosed }) => {
    return (
        <div className={`flex flex-col divide-y divide-dashed ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
            {items.map(item => (
                <div key={item.id} className="py-5 flex justify-between items-center gap-4 hover:bg-white/5 rounded-lg px-3 transition-colors group animate-fade-in-up">
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                            <h3 className={`font-medium text-lg group-hover:text-primary transition-colors ${getTextStyle(darkMode, customBgInfo)}`}>
                                {getTrans(item, selectedLanguage, 'name')}
                            </h3>
                            <div className={`flex-1 mx-4 border-b border-dotted h-4 opacity-30 hidden sm:block ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                            <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(String(item.price).replace(/[^0-9.]/g, '')) || 0)}
                            </span>
                        </div>
                        {item.desc && (
                            <p className={`text-xs line-clamp-1 italic ${getSubTextStyle(darkMode, customBgInfo)}`}>
                                {getTrans(item, selectedLanguage, 'desc')}
                            </p>
                        )}
                    </div>

                    <div>
                        <QuantityControls item={item} isEditing={isEditing} primaryColor={primaryColor} darkMode={darkMode} restaurantClosed={restaurantClosed} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const GridLayoutSkeleton = ({ darkMode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`rounded-xl overflow-hidden border ${darkMode ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-gray-100'} h-80`}>
                <Skeleton height="200px" darkMode={darkMode} className="rounded-none" />
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

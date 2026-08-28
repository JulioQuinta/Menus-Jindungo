import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { GridLayout, ListLayout, MinimalLayout, GridLayoutSkeleton, ListLayoutSkeleton } from './MenuLayouts';
import StickyCategoryNav from './StickyCategoryNav';
import HighlightsCarousel from './HighlightsCarousel'; // Assuming these exist or will be uncommented
import { getContrastColor, darkenColor } from '../utils/colorUtils';
import { Search, X, Utensils } from 'lucide-react';

import { getTranslation, UI_TRANSLATIONS } from '../utils/i18n';

const FlagSelector = ({ selected, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const languages = [
        { code: 'PT', flag: '🇦🇴', label: 'Português' },
        { code: 'EN', flag: '🇺🇸', label: 'English' },
        { code: 'FR', flag: '🇫🇷', label: 'Français' },
        { code: 'ES', flag: '🇪🇸', label: 'Español' },
        { code: 'AR', flag: '🇦🇪', label: 'العربية' },
        { code: 'ZH', flag: '🇨🇳', label: '中文(简体)' }
    ];

    const current = languages.find(l => l.code === selected) || languages[0];

    return (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 shadow-lg text-white hover:bg-black/40 transition-all group"
                >
                    <span className="text-xl leading-none filter drop-shadow-md">{current.flag}</span>
                    <svg
                        className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-[#1E1E1E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onSelect(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 last:border-0 ${selected === lang.code ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <span className="text-sm font-medium">{lang.label}</span>
                                {selected === lang.code && <span className="ml-auto text-xs">✓</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CategoryCarousel = ({ categories, activeCategory, onSelect, primaryColor, selectedLanguage }) => {
    // Auto-scroll the active category into view
    const scrollRef = React.useRef(null);
    
    // Clean category rendering without repeating to save memory
    const loopedCategories = categories;

    React.useEffect(() => {
        if (scrollRef.current && activeCategory) {
            const activeBtn = scrollRef.current.querySelector(`[data-catid="${activeCategory}"]`);
            if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeCategory]);

    const translateCat = (cat) => {
        const label = cat.label || cat.name;
        const dict = UI_TRANSLATIONS[selectedLanguage]?.standardCategories || {};
        return dict[label] || label;
    };

    return (
        <div className="relative group">
            {/* Scroll Indicators (Subtle Gradients) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10" />

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-3 p-4 scrollbar-hide snap-x"
            >
                {loopedCategories.map((cat, idx) => (
                    <button
                        key={`${cat.id}-${idx}`}
                        data-catid={cat.id}
                        data-active={activeCategory === cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 min-w-[64px] rounded-xl transition-all border snap-start active:scale-95 ${activeCategory === cat.id
                            ? 'bg-[#1E1E1E] text-white shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105 border-[#D4AF37]'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-0.5 transition-all duration-300 ${activeCategory === cat.id ? 'bg-[#D4AF37] text-black animate-bounce' : 'bg-black/20 grayscale'
                            }`}>
                            {(() => {
                                const l = cat.label || cat.name;
                                if (l.includes('Bebida')) return '🍷';
                                if (l === 'Sobremesas') return '🍰';
                                if (l === 'Para Começar' || l === 'Entradas') return '🍤';
                                if (l.includes('Chef')) return '👨‍🍳';
                                if (l.includes('Leveza')) return '🥗';
                                if (l.includes('Prato')) return '🥩';
                                if (l.includes('Acompanhamentos')) return '🍟';
                                return '🍽️';
                            })()}
                        </div>
                        <span className={`text-[10px] font-bold whitespace-nowrap leading-tight max-w-[80px] truncate ${activeCategory === cat.id ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                            {translateCat(cat)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const CategorySection = ({ cat, Layout, commonProps, fontFamily, onItemAdded, selectedLanguage }) => {
    const subcategories = [...new Set(cat.items.map(i => i.subcategory).filter(Boolean))];
    const [activeSub, setActiveSub] = React.useState('Todos');

    const filteredItems = activeSub === 'Todos'
        ? cat.items
        : cat.items.filter(i => i.subcategory === activeSub);

    const translateCat = (label) => {
        const dict = UI_TRANSLATIONS[selectedLanguage]?.standardCategories || {};
        return dict[label] || label;
    };

    if (filteredItems.length === 0 && activeSub !== 'Todos') return null;

    return (
        <div id={`category-${cat.id}`} className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 flex items-center gap-2" style={{ color: commonProps.primaryColor }}>
                <span className="w-1 h-6 rounded-full bg-current block"></span>
                {translateCat(cat.label)}
            </h2>

            {subcategories.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setActiveSub('Todos')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeSub === 'Todos'
                            ? 'text-white shadow-md'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                            }`}
                        style={{ backgroundColor: activeSub === 'Todos' ? commonProps.primaryColor : undefined }}
                    >
                        {getTranslation(selectedLanguage, 'all')}
                    </button>
                    {subcategories.map(sub => (
                        <button
                            key={sub}
                            onClick={() => setActiveSub(sub)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeSub === sub
                                ? 'text-white shadow-md'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                            style={{ backgroundColor: activeSub === sub ? commonProps.primaryColor : undefined }}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            )}

            <Layout items={filteredItems} {...commonProps} fontFamily={fontFamily} onItemAdded={onItemAdded} />
        </div>
    );
};

const LivePreview = ({ config, categories, isEditing, isLoading, isFullPage, restaurantId, features = {}, onItemAdded, selectedLanguage = 'PT', onLanguageChange }) => {
    const { layoutMode, primaryColor, fontFamily, backgroundImage, darkMode, backgroundColor } = config;
    const [activeCategory, setActiveCategory] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showSearch, setShowSearch] = React.useState(false);

    // Initialize active category once loaded
    React.useEffect(() => {
        if (!activeCategory && categories.length > 0) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    const effectivePrimaryColor = primaryColor || '#D4AF37';
    // If background is not set, use a very light tint of the primary color for a themed look
    const defaultLightBg = darkenColor(effectivePrimaryColor, -92).slice(0, 7);
    const effectiveBgColor = backgroundColor || (darkMode ? '#0A0A0B' : defaultLightBg);
    const effectiveTextColor = backgroundColor ? getContrastColor(effectiveBgColor) : (darkMode ? '#ffffff' : '#1a1a1a');

    const t = (key) => getTranslation(selectedLanguage, key);

    const renderLayout = () => {
        if (isLoading) {
            return layoutMode === 'grid' ? <GridLayoutSkeleton darkMode={darkMode} /> : <ListLayoutSkeleton darkMode={darkMode} />;
        }

        if (!categories || categories.length === 0) {
            return (
                <div className="text-center py-20 flex flex-col items-center gap-4 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/5 mx-4 my-8 shadow-inner overflow-hidden relative">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary/60 border border-primary/20 animate-pulse-slow">
                        <Utensils size={32} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1 relative z-10 px-6">
                        <p className="text-lg font-bold tracking-tight" style={{ color: effectiveTextColor }}>Ementa em Preparação</p>
                        <p className="text-sm opacity-60 leading-relaxed font-medium" style={{ color: effectiveTextColor }}>Estamos a organizar as melhores opções para si. <br /> Por favor, regresse em breve!</p>
                    </div>
                    <div className="mt-4 px-4 py-1.5 bg-black/20 rounded-full border border-white/5 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                        Menus Jindungo Digital
                    </div>
                </div>
            );
        }

        const isCustomBg = !!backgroundColor;

        const filteredCategories = categories.map(cat => {
            const filteredItems = cat.items.filter(item => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    item.name.toLowerCase().includes(searchLower) ||
                    (item.desc && item.desc.toLowerCase().includes(searchLower))
                );
            });
            return { ...cat, items: filteredItems };
        }).filter(cat => cat.items.length > 0);

        if (searchTerm && filteredCategories.length === 0) {
            return (
                <div className="text-center py-20 animate-fade-in">
                    <div className="text-4xl mb-4 grayscale opacity-50">🔍</div>
                    <p className="text-gray-500 font-medium">
                        {t('noResults')} "{searchTerm}"
                    </p>
                </div>
            );
        }

        const commonProps = { primaryColor, isEditing, darkMode, selectedLanguage, restaurantClosed: config.isOpen === false, customBgInfo: { isCustom: isCustomBg, textColor: effectiveTextColor, bgColor: effectiveBgColor } };

        const targetCategories = searchTerm 
            ? filteredCategories 
            : categories.filter(cat => cat.id === activeCategory);

        // Fallback: if no active category (e.g. initial load before state), show first
        const displayCategories = targetCategories.length > 0 
            ? targetCategories 
            : categories;

        const Layout = layoutMode === 'grid' ? GridLayout : (layoutMode === 'minimal' ? MinimalLayout : ListLayout);

        return displayCategories.map(cat => (
            <CategorySection key={cat.id} cat={cat} Layout={Layout} commonProps={commonProps} onItemAdded={onItemAdded} selectedLanguage={selectedLanguage} />
        ));
    };

    const handleCategorySelect = (id) => {
        setActiveCategory(id);
        // Reseta o scroll da lista ao trocar de categoria
        const scrollContainer = document.querySelector('.overflow-y-auto') || window;
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };


    return (
        <div className={`min-h-screen ${isFullPage ? '' : 'rounded-3xl overflow-hidden border border-gray-800'}`}
            style={{
                fontFamily: fontFamily || 'Inter, sans-serif',
                backgroundColor: effectiveBgColor,
                color: effectiveTextColor,
                transition: 'background-color 0.5s ease',
                minHeight: '100%'
            }}>

            {/* Header / Hero */}
            <div
                className="relative p-3 sm:p-8 pt-12 pb-6 sm:pb-14 flex flex-col items-center transition-all duration-700 overflow-hidden min-h-[220px] sm:min-h-[300px] justify-center"
                style={{
                    backgroundColor: effectivePrimaryColor,
                    backgroundImage: config.headerBgUrl
                        ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url(${config.headerBgUrl})`
                        : (darkMode
                            ? `linear-gradient(to bottom, ${darkenColor(effectivePrimaryColor, 60)}, ${darkenColor(effectivePrimaryColor, 80)})`
                            : `linear-gradient(to bottom, ${darkenColor(effectivePrimaryColor, 35)}, ${darkenColor(effectivePrimaryColor, 60)})`),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Background Overlay - Subtle blur only for images, pointer-events-none to prevent blocking */}
                {config.headerBgUrl && (
                    <div className="absolute inset-0 z-0 backdrop-blur-[0.5px] pointer-events-none bg-black/10"></div>
                )}

                <div className="relative z-10 flex flex-col items-center justify-center mb-4 text-center animate-fade-in w-full">
                    {/* Logo Section - Vertical Stack like reference image */}
                    <div className="flex flex-col items-center gap-1 mb-2 transform hover:scale-105 transition-transform duration-500">
                        {/* Dynamic Logo or Fallback Icon */}
                        {config.logoUrl ? (
                            <img
                                src={config.logoUrl}
                                alt={config.restaurantName || "Logotipo"}
                                className="w-20 h-20 sm:w-32 sm:h-32 object-contain filter drop-shadow-2xl mb-2 transition-all"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-2 border-2 border-[#D4AF37]">
                                <span className="text-4xl">🍽️</span>
                            </div>
                        )}

                        {/* Text Stack - Only Restaurant Name */}
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-2xl sm:text-4xl font-serif font-bold text-[#D4AF37] drop-shadow-md tracking-wider text-center px-4 transition-all">
                                {config.restaurantName || 'Restaurante'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Language Flag Selector (Absolute Top Right) */}
                <FlagSelector selected={selectedLanguage} onSelect={onLanguageChange} />



                <div className="text-center relative z-10 w-full px-4">
                    <p className={`text-[10px] font-display mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${darkMode ? 'text-white' : 'text-white/95'}`}>
                        {t('welcome')} {config.restaurantName || 'Jindungo'}
                    </p>
                </div>

                {/* Search Toggle & Bar - Available for all plans now */}
                {features.hasDynamicSearch && (
                    <div className="w-full flex flex-col items-center relative z-20">
                        {!showSearch ? (
                            <button
                                onClick={() => setShowSearch(true)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${config.headerBgUrl ? 'bg-black/70 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
                            >
                                <Search size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">Pesquisar no Menu</span>
                            </button>
                        ) : (
                            <div className="w-full max-w-sm relative animate-in slide-in-from-top-4 duration-300">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
                                    <Search size={18} />
                                </div>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('searchPlaceholder')}
                                    className={`w-full rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all text-sm font-medium ${config.headerBgUrl ? 'bg-black/80 border-white/40 shadow-2xl' : 'bg-white/10 border-white/20'}`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setShowSearch(false);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-full"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

             {/* Sticky Category Carousel */}
             {!isLoading && categories.length > 0 && (
                 <div
                     className="sticky top-0 z-[70] py-2 transition-all border-b backdrop-blur-2xl shadow-sm"
                     style={{
                         backgroundColor: darkMode ? 'rgba(18,18,18,0.92)' : 'rgba(255,255,255,0.92)',
                         borderBottomColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                         marginTop: '-1px' // Prevent pixel gap
                     }}
                 >
                    <CategoryCarousel
                        categories={categories}
                        activeCategory={activeCategory || categories[0]?.id}
                        onSelect={handleCategorySelect}
                        primaryColor={effectivePrimaryColor}
                        selectedLanguage={selectedLanguage}
                    />
                </div>
            )}

            <div key={searchTerm ? 'search' : activeCategory} className="p-3 pb-32 space-y-1 sm:space-y-2 animate-fade-in-up">
                {renderLayout()}
            </div>

            {/* Branding Watermark */}
            {!features.canHideBranding && (
                <div className="pb-8 pt-4 text-center opacity-50 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-1">{t('tech')}</span>
                    <div className="flex items-center gap-1.5 grayscale">
                        <img src="/jindungo_logo_v3.png" className="w-12 h-12 object-contain" alt="Logo" />
                        <span className="font-serif font-bold text-sm tracking-tight">Menus Jindungo</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivePreview;

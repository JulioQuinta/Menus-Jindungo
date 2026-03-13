import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { GridLayout, ListLayout, MinimalLayout, GridLayoutSkeleton, ListLayoutSkeleton } from './MenuLayouts';
import StickyCategoryNav from './StickyCategoryNav';
import HighlightsCarousel from './HighlightsCarousel'; // Assuming these exist or will be uncommented
import { getContrastColor } from '../utils/colorUtils';

import { Search, X, Globe } from 'lucide-react';
// import SearchBar from './SearchBar';

const FlagSelector = ({ selected, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const languages = [
        { code: 'PT', flag: '🇦🇴', label: 'Português' },
        { code: 'EN', flag: '🇺🇸', label: 'English' },
        { code: 'FR', flag: '🇫🇷', label: 'Français' },
        { code: 'ES', flag: '🇪🇸', label: 'Español' }
    ];

    const current = languages.find(l => l.code === selected) || languages[0];

    return (
        <div className="absolute top-6 right-6 z-50">
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

const CategoryCarousel = ({ categories, activeCategory, onSelect, primaryColor }) => {
    // Auto-scroll the active category into view
    const scrollRef = React.useRef(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
            if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeCategory]);

    return (
        <div className="relative group">
            {/* Scroll Indicators (Subtle Gradients) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-10" />

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-3 p-4 scrollbar-hide snap-x"
            >
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        data-active={activeCategory === cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-2 min-w-[72px] rounded-xl transition-all border snap-start active:scale-95 ${activeCategory === cat.id
                            ? 'bg-[#1E1E1E] text-white shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105 border-[#D4AF37]'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-0.5 transition-all duration-300 ${activeCategory === cat.id ? 'bg-[#D4AF37] text-black animate-bounce' : 'bg-black/20 grayscale'
                            }`}>
                            {(() => {
                                const l = cat.label;
                                if (l.includes('Bebidas')) return '🍷';
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
                            {cat.label || cat.name}
                        </span>
                    </button>
                ))}
                {/* Spacer to allow scrolling far right */}
                <div className="min-w-[20px]" />
            </div>
        </div>
    );
};

const LivePreview = ({ config, categories, isEditing, isLoading, isFullPage, restaurantId, features = {} }) => {
    const { layoutMode, primaryColor, fontFamily, backgroundImage, darkMode, backgroundColor } = config;
    const [selectedLanguage, setSelectedLanguage] = React.useState('PT');
    const [activeCategory, setActiveCategory] = React.useState(categories?.[0]?.id);
    const [searchTerm, setSearchTerm] = React.useState('');

    const translations = {
        PT: { welcome: 'Bem-vindo ao', searchPlaceholder: 'Pesquisar no menu...', noResults: 'Nenhum resultado para', waitMsg: 'O garçom está a caminho!', tech: 'Tecnologia' },
        EN: { welcome: 'Welcome to', searchPlaceholder: 'Search menu...', noResults: 'No results for', waitMsg: 'The waiter is coming!', tech: 'Technology' },
        FR: { welcome: 'Bienvenue à', searchPlaceholder: 'Chercher au menu...', noResults: 'Aucun résultat pour', waitMsg: 'Le serveur arrive!', tech: 'Technologie' },
        ES: { welcome: 'Bienvenido a', searchPlaceholder: 'Buscar en el menú...', noResults: 'No hay resultados para', waitMsg: '¡El camarero viene!', tech: 'Tecnología' }
    };

    const renderLayout = () => {
        if (isLoading) {
            return layoutMode === 'grid' ? <GridLayoutSkeleton /> : <ListLayoutSkeleton />;
        }

        if (!categories || categories.length === 0) {
            return (
                <div className="text-center py-10 text-gray-500">
                    <p>Nenhum item disponível no momento.</p>
                </div>
            );
        }

        const effectiveBgColor = backgroundColor || (darkMode ? '#121212' : '#f8f9fa');
        const effectiveTextColor = backgroundColor ? getContrastColor(effectiveBgColor) : (darkMode ? '#ffffff' : '#1a1a1a');
        const isCustomBg = !!backgroundColor;

        const filteredCategories = categories.map(cat => {
            const filteredItems = cat.items.filter(item => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    item.name.toLowerCase().includes(searchLower) ||
                    (item.description && item.description.toLowerCase().includes(searchLower))
                );
            });
            return { ...cat, items: filteredItems };
        }).filter(cat => cat.items.length > 0);

        if (searchTerm && filteredCategories.length === 0) {
            return (
                <div className="text-center py-20 animate-fade-in">
                    <div className="text-4xl mb-4 grayscale opacity-50">🔍</div>
                    <p className="text-gray-500 font-medium">
                        {translations[selectedLanguage].noResults} "{searchTerm}"
                    </p>
                </div>
            );
        }

        const commonProps = { primaryColor, isEditing, darkMode, selectedLanguage, customBgInfo: { isCustom: isCustomBg, textColor: effectiveTextColor, bgColor: effectiveBgColor } };

        const targetCategories = searchTerm ? filteredCategories : categories;

        switch (layoutMode) {
            case 'grid':
                return targetCategories.map(cat => (
                    <CategorySection key={cat.id} cat={cat} Layout={GridLayout} commonProps={commonProps} />
                ));
            case 'minimal':
                return targetCategories.map(cat => (
                    <CategorySection key={cat.id} cat={cat} Layout={MinimalLayout} commonProps={commonProps} fontFamily={fontFamily} />
                ));
            case 'list':
            default:
                return targetCategories.map(cat => (
                    <CategorySection key={cat.id} cat={cat} Layout={ListLayout} commonProps={commonProps} />
                ));
        }
    };

    // [NEW] Helper Component for Category Section with Subcategory Tabs
    const CategorySection = ({ cat, Layout, commonProps, fontFamily }) => {
        // Extract unique subcategories
        const subcategories = [...new Set(cat.items.map(i => i.subcategory).filter(Boolean))];
        const [activeSub, setActiveSub] = React.useState('Todos');

        // Filter items based on active subcategory
        const filteredItems = activeSub === 'Todos'
            ? cat.items
            : cat.items.filter(i => i.subcategory === activeSub);

        if (filteredItems.length === 0 && activeSub !== 'Todos') return null;

        return (
            <div id={`category-${cat.id}`} className="mb-8 scroll-mt-32">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: commonProps.primaryColor }}>
                    <span className="w-1 h-6 rounded-full bg-current block"></span>
                    {cat.label}
                </h2>

                {/* Subcategory Tabs */}
                {subcategories.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setActiveSub('Todos')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeSub === 'Todos'
                                ? 'text-white shadow-md'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                            style={{ backgroundColor: activeSub === 'Todos' ? commonProps.primaryColor : undefined }}
                        >
                            Todos
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

                <Layout items={filteredItems} {...commonProps} fontFamily={fontFamily} />
            </div>
        );
    };

    const scrollToCategory = (id) => {
        setActiveCategory(id);
        const el = document.getElementById(`category-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const effectiveBgColor = backgroundColor || (darkMode ? '#121212' : '#f8f9fa');
    const effectiveTextColor = backgroundColor ? getContrastColor(effectiveBgColor) : (darkMode ? '#ffffff' : '#1a1a1a');

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
            <div className={`relative p-8 pt-12 pb-10 flex flex-col items-center ${darkMode ? 'bg-gradient-to-b from-[#2E0000] to-[#1A0000]' : 'bg-gradient-to-b from-[#4A0404] via-[#2E0202] to-[#1A0000]'}`}>
                <div className="flex flex-col items-center justify-center mb-4 text-center animate-fade-in">
                    {/* Logo Section - Vertical Stack like reference image */}
                    <div className="flex flex-col items-center gap-1 mb-2 transform hover:scale-105 transition-transform duration-500">
                        {/* Dynamic Logo or Fallback Icon */}
                        {config.logoUrl ? (
                            <img
                                src={config.logoUrl}
                                alt={config.restaurantName || "Logotipo"}
                                className="w-32 h-32 object-contain filter drop-shadow-2xl mb-2"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-2 border-2 border-[#D4AF37]">
                                <span className="text-4xl">🍽️</span>
                            </div>
                        )}

                        {/* Text Stack - Only Restaurant Name */}
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-4xl font-serif font-bold text-[#D4AF37] drop-shadow-md tracking-wider text-center px-4">
                                {config.restaurantName || 'Restaurante'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Language Selector - Top Right Absolute */}
                <FlagSelector selected={selectedLanguage} onSelect={setSelectedLanguage} />



                {/* Welcome Text */}
                <div className="text-center">
                    <p className={`text-sm font-medium tracking-widest uppercase mb-6 ${darkMode ? 'text-white/80' : 'text-white/90'}`}>
                        {translations[selectedLanguage].welcome} {config.restaurantName || 'Jindungo'}
                    </p>
                </div>

                {/* Corporate Feature: Dynamic Search */}
                {features.hasDynamicSearch && (
                    <div className="w-full max-w-sm relative animate-fade-in">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder={translations[selectedLanguage].searchPlaceholder}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Category Carousel */}
            {!isLoading && categories.length > 0 && (
                <div className={`sticky top-0 z-40 py-3 transition-all border-b ${darkMode ? 'bg-[#121212]/95 backdrop-blur-md border-white/5' : 'bg-white/95 backdrop-blur-md border-gray-100'}`}>
                    <CategoryCarousel
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelect={scrollToCategory}
                        primaryColor="#D4AF37" // Always Gold for premium feel
                    />
                </div>
            )}

            <div className="p-4 pb-32 space-y-2">
                {renderLayout()}
            </div>

            {/* Branding Watermark */}
            {!features.canHideBranding && (
                <div className="pb-8 pt-4 text-center opacity-50 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-1">Tecnologia</span>
                    <div className="flex items-center gap-1.5 grayscale">
                        <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-[10px] text-[#D4AF37] font-serif border border-gray-800">M</div>
                        <span className="font-serif font-bold text-sm tracking-tight">JindungoMenus</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivePreview;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { GridLayout, ListLayout, MinimalLayout, GridLayoutSkeleton, ListLayoutSkeleton } from './MenuLayouts';
import { getContrastColor, darkenColor } from '../utils/colorUtils';
import { Search, X, Utensils, ArrowLeft } from 'lucide-react';
import { getTranslation, UI_TRANSLATIONS, translateFoodText } from '../utils/i18n';

const FlagSelector = ({ selected, onSelect }) => {
    const [isOpen, ReactSetIsOpen] = React.useState(false);
    const languages = [
        { code: 'PT', flag: '🇦🇴', label: 'AO', name: 'Angola (Português)' },
        { code: 'EN', flag: '🇺🇸', label: 'EN', name: 'English' },
        { code: 'FR', flag: '🇫🇷', label: 'FR', name: 'Français' },
        { code: 'ES', flag: '🇪🇸', label: 'ES', name: 'Español' }
    ];

    const current = languages.find(l => l.code === selected) || languages[0];

    return (
        <div className="absolute top-4 right-4 z-[90] font-sans">
            <div className="relative">
                <button
                    onClick={() => ReactSetIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-black/75 backdrop-blur-2xl px-4.5 py-2.5 rounded-full border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.95)] text-white hover:bg-black/90 transition-all group text-xs font-bold tracking-widest uppercase cursor-pointer"
                >
                    <span className="flex items-center gap-1.5">
                        <span className="text-sm leading-none shrink-0">{current.flag}</span>
                        <span className="leading-none">{current.label}</span>
                    </span>
                    <svg
                        className={`w-3.5 h-3.5 text-[#E5C27B] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-[#141414]/95 backdrop-blur-3xl border border-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-200 z-[100]">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onSelect(lang.code);
                                    ReactSetIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors border-b border-gray-800/80 last:border-0 cursor-pointer ${
                                    selected === lang.code ? 'bg-[#E5C27B]/15 text-[#E5C27B] font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="text-xs font-bold flex items-center gap-2">
                                    <span className="text-sm leading-none shrink-0">{lang.flag}</span>
                                    <span className="leading-none">{lang.name}</span>
                                </span>
                                <span className="text-[10px] font-black opacity-60 tracking-wider uppercase">{lang.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const getCatIcon = (l) => {
    const name = (l || '').toLowerCase();
    if (name.includes('local') || name.includes('terra')) return '🥘';
    if (name.includes('pequeno') || name.includes('almoço')) return '🍳';
    if (name.includes('entrada') || name.includes('começar')) return '🛎️';
    if (name.includes('sopa') || name.includes('caldo')) return '🥣';
    if (name.includes('sobremesa') || name.includes('doce')) return '🍰';
    if (name.includes('bebida') || name.includes('vinho')) return '🍷';
    if (name.includes('carne') || name.includes('grelhado')) return '🥩';
    if (name.includes('peixe') || name.includes('marisco')) return '🍤';
    if (name.includes('salada') || name.includes('leve')) return '🥗';
    return '🍽️';
};

// Seamless Infinite Category Carousel
// Seamless Infinite Category Carousel
const CategoryCarousel = ({ categories, activeCategory, onSelect, selectedLanguage }) => {
    const scrollRef = useRef(null);

    const infiniteCategories = [...categories, ...categories, ...categories, ...categories, ...categories, ...categories];

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || categories.length <= 1) return;

        const handleScroll = () => {
            const singleSetWidth = el.scrollWidth / 6;
            if (el.scrollLeft < singleSetWidth) {
                el.scrollLeft += singleSetWidth * 3;
            } else if (el.scrollLeft > singleSetWidth * 4) {
                el.scrollLeft -= singleSetWidth * 3;
            }
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        if (el.scrollLeft === 0) {
            el.scrollLeft = (el.scrollWidth / 6) * 2;
        }

        return () => el.removeEventListener('scroll', handleScroll);
    }, [categories]);

    const translateCat = (cat) => {
        const label = cat.label || cat.name;
        return translateFoodText(label, selectedLanguage);
    };

    return (
        <div className="relative bg-[#0D0D0D] py-4 border-b border-[#1A1A1A] shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0D0D0D] to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0D0D0D] to-transparent pointer-events-none z-10"></div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-3.5 px-6 scrollbar-hide cursor-grab active:cursor-grabbing items-center py-1"
            >
                {infiniteCategories.map((cat, idx) => {
                    const isActive = activeCategory === cat.id;
                    const catName = translateCat(cat).toLowerCase();
                    return (
                        <button
                            key={`${cat.id}-${idx}`}
                            onClick={() => onSelect(cat.id)}
                            className={`flex-shrink-0 flex items-center gap-2 sm:gap-2.5 py-2 sm:py-3 px-4 sm:px-5 rounded-full transition-all cursor-pointer active:scale-95 ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#F9BF00] via-[#E5C27B] to-[#D4AF37] text-gray-950 shadow-[0_8px_25px_rgba(212,175,55,0.45)] scale-105 font-black ring-2 ring-[#E5C27B]/50'
                                    : 'bg-[#181818]/90 border border-white/10 text-[#A0A0A5] shadow-md hover:border-white/20 hover:text-white'
                            }`}
                        >
                            <span className="text-lg sm:text-xl filter drop-shadow">
                                {getCatIcon(cat.label || cat.name)}
                            </span>
                            <span className="text-[11px] sm:text-xs tracking-wider font-sans whitespace-nowrap font-bold">
                                {catName}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const CategorySection = ({ cat, Layout, commonProps, onItemAdded, selectedLanguage }) => {
    const [activeFilter, setActiveFilter] = useState('Todos');

    const translateCat = (label) => {
        return translateFoodText(label, selectedLanguage);
    };

    const isRecommended = (item) => item.isHighlight || item.isRecommended || item.ordersCount > 15;

    const filteredItems = activeFilter === 'Todos'
        ? cat.items
        : cat.items.filter(isRecommended);

    if (filteredItems.length === 0 && activeFilter !== 'Todos') return null;

    const getPluralItems = () => {
        if (selectedLanguage === 'PT') return cat.items.length === 1 ? 'item' : 'itens';
        if (selectedLanguage === 'FR') return cat.items.length === 1 ? 'article' : 'articles';
        if (selectedLanguage === 'ES') return cat.items.length === 1 ? 'artículo' : 'artículos';
        return cat.items.length === 1 ? 'item' : 'items';
    };

    return (
        <div id={`category-${cat.id}`} data-category-id={cat.id} className="mb-16 scroll-mt-48 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 sm:px-6">
            {/* Title matching screenshot with intense gold glow shadow */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="w-1.5 sm:w-2 h-6 sm:h-7 rounded-full bg-gradient-to-b from-[#F9BF00] to-[#D4AF37] shadow-[0_0_15px_#E5C27B]"></div>
                <h2 className="text-lg sm:text-2xl font-serif font-black text-[#E5C27B] lowercase capitalize-first tracking-wide drop-shadow-md flex items-center gap-2">
                    {translateCat(cat.label || cat.name)}
                    <span className="text-[10px] sm:text-xs font-sans font-normal opacity-40 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                        {cat.items.length} {getPluralItems()}
                    </span>
                </h2>
            </div>

            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setActiveFilter('Todos')}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider transition-all shadow-md ${
                        activeFilter === 'Todos'
                            ? 'bg-gradient-to-r from-[#D4AF37] via-[#E5C27B] to-[#C59B27] text-gray-950 shadow-[0_0_25px_rgba(229,194,123,0.5)] font-black'
                            : 'bg-[#1A1A1C] text-gray-400 border border-white/10 hover:bg-[#252525] hover:text-white font-medium'
                    }`}
                >
                    {getTranslation(selectedLanguage, 'all')}
                </button>
                <button
                    onClick={() => setActiveFilter('Recomendados')}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black tracking-wider transition-all shadow-md ${
                        activeFilter === 'Recomendados'
                            ? 'bg-gradient-to-r from-[#D4AF37] via-[#E5C27B] to-[#C59B27] text-gray-950 shadow-[0_0_25px_rgba(229,194,123,0.5)] font-black'
                            : 'bg-[#1A1A1C] text-gray-400 border border-white/10 hover:bg-[#252525] hover:text-white font-medium'
                    }`}
                >
                    {getTranslation(selectedLanguage, 'recommended')}
                </button>
            </div>

            <Layout items={filteredItems} {...commonProps} onItemAdded={onItemAdded} />
        </div>
    );
};

const LivePreview = ({ config, categories, isEditing, isLoading, isFullPage, restaurantId, features = {}, onItemAdded, selectedLanguage = 'PT', onLanguageChange, coupons = [], restaurantClosed = false }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const isDemo = (slug === 'demo-restaurant' || window.location.pathname.includes('demo-restaurant')) && !window.location.pathname.includes('/admin/');

    const [activeCategory, setActiveCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Otimização de Performance: useMemo para filtragem de ementa (OWASP / Performance)
    const filteredCategories = React.useMemo(() => {
        if (!categories) return [];
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return categories;

        return categories.map(cat => {
            const filteredItems = cat.items.filter(item => {
                return (
                    item.name.toLowerCase().includes(searchLower) ||
                    (item.desc && item.desc.toLowerCase().includes(searchLower))
                );
            });
            return { ...cat, items: filteredItems };
        }).filter(cat => cat.items.length > 0);
    }, [categories, searchTerm]);

    useEffect(() => {
        if (!activeCategory && categories?.length > 0) {
            setActiveCategory(categories[0].id);
        }
    }, [categories, activeCategory]);

    const defaultCoverImg = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80';
    const effectivePrimaryColor = '#E5C27B';
    const effectiveBgColor = '#101010';
    const effectiveTextColor = '#ffffff';

    const t = (key) => getTranslation(selectedLanguage, key);

    const renderLayout = () => {
        if (isLoading) {
            return <GridLayoutSkeleton darkMode={true} />;
        }

        if (!categories || categories.length === 0) {
            return (
                <div className="text-center py-20 flex flex-col items-center gap-4 bg-[#121213] rounded-3xl border border-[#1E1E20] mx-4 my-8 shadow-2xl">
                    <div className="w-16 h-16 bg-[#E5C27B]/10 rounded-full flex items-center justify-center text-[#E5C27B] border border-[#E5C27B]/30 animate-pulse">
                        <Utensils size={32} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1 px-6 text-white">
                        <p className="text-lg font-bold font-serif text-[#E5C27B]">Ementa em Preparação</p>
                        <p className="text-sm opacity-60 font-light">Estamos a preparar as melhores iguarias para si. Regresse em breve!</p>
                    </div>
                </div>
            );
        }

        // Utiliza a variável optimizada do useMemo em vez de recalcular a cada renderização

        if (searchTerm && filteredCategories.length === 0) {
            return (
                <div className="text-center py-20 animate-fade-in text-white">
                    <div className="text-4xl mb-4 opacity-50">🔍</div>
                    <p className="text-[#8E8E93] font-medium">
                        Nenhum prato encontrado para "{searchTerm}"
                    </p>
                </div>
            );
        }

        const commonProps = { primaryColor: effectivePrimaryColor, isEditing, darkMode: true, selectedLanguage, restaurantClosed };
        const Layout = config.layoutMode === 'list' ? ListLayout : (config.layoutMode === 'minimal' ? MinimalLayout : GridLayout);

        if (searchTerm) {
            return filteredCategories.map(cat => (
                <CategorySection key={cat.id} cat={cat} Layout={Layout} commonProps={commonProps} onItemAdded={onItemAdded} selectedLanguage={selectedLanguage} />
            ));
        }

        const currentCat = categories.find(c => c.id === activeCategory) || categories[0];
        if (!currentCat || !currentCat.items || currentCat.items.length === 0) return null;

        return (
            <CategorySection key={currentCat.id} cat={currentCat} Layout={Layout} commonProps={commonProps} onItemAdded={onItemAdded} selectedLanguage={selectedLanguage} />
        );
    };

    const handleCategorySelect = (id) => {
        setActiveCategory(id);
        const navAnchor = document.getElementById('sticky-nav-anchor');
        if (navAnchor) {
            navAnchor.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className={`min-h-screen relative ${isFullPage ? '' : 'rounded-3xl overflow-hidden border border-[#222]'}`}
            style={{
                fontFamily: 'Inter, sans-serif',
                backgroundColor: effectiveBgColor,
                color: effectiveTextColor,
                minHeight: '100%'
            }}>

            {/* Top Cover Header matching screenshot with deep atmospheric shadow gradient */}
            <div
                className="relative p-6 pt-16 sm:pt-24 pb-12 flex flex-col items-center justify-center text-center overflow-hidden border-b border-[#1A1A1C] shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.72), rgba(10,10,10,0.98)), url(${config.headerBgUrl || defaultCoverImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {isDemo && (
                    <button
                        onClick={() => navigate('/')}
                        className="absolute top-4 left-4 z-[90] flex items-center gap-2 bg-black/75 backdrop-blur-2xl px-4.5 py-2.5 rounded-full border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.95)] text-white hover:bg-black/90 hover:border-[#E5C27B]/50 hover:text-[#E5C27B] transition-all group text-xs font-bold tracking-widest uppercase cursor-pointer active:scale-95"
                        title="Voltar ao Menu Principal"
                    >
                        <ArrowLeft size={14} className="text-[#E5C27B] group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
                        <span className="leading-none">Voltar</span>
                    </button>
                )}

                <FlagSelector selected={selectedLanguage} onSelect={onLanguageChange} />

                <div className="relative z-10 flex flex-col items-center max-w-xl w-full animate-fade-in">
                    {/* Adaptive Logo Crest (Handles Rectangular, Circular, or Typography logos seamlessly) */}
                    <div className="max-w-[150px] sm:max-w-[180px] max-h-[70px] sm:max-h-[80px] flex items-center justify-center mb-4 sm:mb-6 p-0 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden">
                        {config.logoUrl ? (
                            <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-0 scale-[1.18] filter drop-shadow-[0_10px_20px_rgba(229,194,123,0.3)] transition-transform duration-300 hover:scale-[1.23]" />
                        ) : (
                            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2">
                                <span className="text-2xl sm:text-3xl filter drop-shadow-[0_0_15px_#E5C27B]">🍽️</span>
                                <span className="font-serif font-bold text-lg sm:text-xl text-[#E5C27B]">{config.restaurantName || 'Comidas'}</span>
                            </div>
                        )}
                    </div>

                    {/* Restaurant Title matching screenshot */}
                    <h1 className="text-2xl sm:text-5xl font-serif font-bold text-[#E5C27B] tracking-wide drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] mb-1.5 sm:mb-2.5 text-center">
                        {config.restaurantName || 'Comidas da Terra'}
                    </h1>

                    {/* Subtitle matching screenshot */}
                    <p className="text-[11px] sm:text-xs font-black tracking-[0.28em] uppercase text-gray-300 mb-8 drop-shadow-md">
                        {t('welcome')} {config.restaurantName || 'Comidas da Terra'}
                    </p>

                    {/* Glowing Capsule Search Bar matching screenshot */}
                    <div className="w-full max-w-sm relative shadow-[0_15px_50px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-500">
                        <input
                            type="text"
                            placeholder={t('searchIguariasPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/80 border border-[#E5C27B]/40 rounded-full py-4 pl-7 pr-14 text-white text-sm font-medium placeholder-gray-400 outline-none focus:border-[#E5C27B] focus:ring-1 focus:ring-[#E5C27B] transition-all backdrop-blur-2xl shadow-inner"
                        />
                        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#E5C27B] to-[#C59B27] text-gray-950 flex items-center justify-center font-bold shadow-[0_0_20px_rgba(229,194,123,0.6)] hover:scale-105 active:scale-95 transition-all">
                            <Search size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sticky Navigation Carousel */}
            {!isLoading && categories.length > 0 && (
                <div
                    id="sticky-nav-anchor"
                    className="sticky top-0 z-[70] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-[#0D0D0D]/95 backdrop-blur-2xl border-b border-[#222]"
                >
                    <CategoryCarousel
                        categories={categories}
                        activeCategory={activeCategory || categories[0]?.id}
                        onSelect={handleCategorySelect}
                        selectedLanguage={selectedLanguage}
                    />
                </div>
            )}

            {/* Catalog Grid Area */}
            <div className="py-8 sm:py-12 min-h-[500px]">
                {renderLayout()}
            </div>

            {/* Decorative Sparkle Watermark in bottom right */}
            <div className="absolute bottom-6 right-6 text-[#E5C27B]/20 pointer-events-none text-4xl animate-pulse select-none hidden sm:block">
                ✦
            </div>

            {/* Footer Branding */}
            {!features.canHideBranding && (
                <div className="pb-20 pt-8 text-center opacity-40 flex flex-col items-center justify-center pointer-events-none border-t border-[#1A1A1C] mx-6">
                    <span className="text-[9px] uppercase tracking-widest font-black mb-1">Tecnologia Jindungo</span>
                    <div className="flex items-center gap-2">
                        <span className="text-base">🌶️</span>
                        <span className="font-serif font-bold text-xs tracking-wider">Menus Jindungo Premium</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivePreview;

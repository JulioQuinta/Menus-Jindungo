import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { menuService } from '../services/menuService';
import { themeService } from '../services/themeService'; // Assuming this exists or using default
// import { analyticsService } from '../services/analyticsService';
import LivePreview from '../components/LivePreview';
import { CartProvider } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import CartFloatingButton from '../components/CartFloatingButton';
import CheckoutModal from '../components/CheckoutModal';
import LoyaltyWidget from '../components/LoyaltyWidget';
import BookingModal from '../components/BookingModal';
import { getPlanFeatures } from '../utils/planLimits';
import { Info, Share2, MapPin, Clock, Instagram, Facebook, Phone, X, Calendar, BellRing } from 'lucide-react';

const DEFAULT_CONFIG = {
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
    fontFamily: 'Inter, sans-serif',
    layoutMode: 'list',
    logoUrl: '',
    darkMode: false,
    isOpen: true
};

const PublicMenu = () => {
    const { slug } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [features, setFeatures] = useState(getPlanFeatures('')); // Default to empty/start
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [initialTable, setInitialTable] = useState(null);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [isCurrentlyClosed, setIsCurrentlyClosed] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            setLoading(true);
            setError(null);

            try {
                // 1. Combined Fetch (Restaurant + Theme + Menu)
                const normalizedSlug = slug ? slug.trim().replace(/\s+/g, '-') : '';
                console.log("Step 1: Fetching optimized menu data for slug:", normalizedSlug);

                const { data: restaurants, error: rError } = await supabase
                    .from('restaurants')
                    .select(`
                        id, 
                        name, 
                        slug, 
                        status, 
                        plan, 
                        delivery_config, 
                        theme_config,
                        business_info,
                        categories (
                            id, 
                            label, 
                            sort_order,
                            menu_items (*)
                        )
                    `)
                    .eq('slug', normalizedSlug);

                if (rError) throw new Error(`Erro de conexão: ${rError.message}`);

                const restaurantData = restaurants?.[0];
                if (!restaurantData) {
                    console.error("No restaurant found for slug:", normalizedSlug);
                    throw new Error('Restaurante não encontrado (404)');
                }

                // Set Restaurant & Features
                setRestaurant(restaurantData);
                setFeatures(getPlanFeatures(restaurantData.plan));

                // 2. Process Theme/Config (Now derived from Step 1)
                const themeData = restaurantData.theme_config || DEFAULT_CONFIG;
                const finalConfig = {
                    ...DEFAULT_CONFIG,
                    ...themeData,
                    restaurantName: restaurantData.name
                };
                setConfig(finalConfig);

                // 3. Process Categories & Items (Now nested in Step 1)
                const dbCategories = restaurantData.categories || [];

                // Sort categories by sort_order
                const sortedCats = [...dbCategories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                // Map to compatible format for LivePreview
                const mappedCats = sortedCats.map(cat => ({
                    id: cat.id,
                    label: cat.label,
                    items: (cat.menu_items || [])
                        .filter(item => item.available)
                        .map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            desc: item.desc_text,
                            img: item.img_url,
                            subcategory: item.subcategory,
                            isHighlight: item.is_highlight,
                            badge: item.badge,
                            translations: {
                                pt: { name: item.name, desc: item.desc_text },
                                en: { name: item.name_en || item.name, desc: item.desc_en || item.desc_text },
                                fr: { name: item.name_fr || item.name, desc: item.desc_fr || item.desc_text },
                                es: { name: item.name_es || item.name, desc: item.desc_es || item.desc_text },
                            }
                        }))
                }));

                setCategories(mappedCats);

                if (restaurantData.business_info) {
                    setBusinessInfo(restaurantData.business_info);
                    checkIsOpen(restaurantData.business_info);
                }

            } catch (err) {
                // If it's an AbortError, it means the request was cancelled (e.g. unmount), ignore it.
                if (err.name === 'AbortError' || err.message?.includes('Abort')) {
                    console.log("Fetch aborted");
                    return;
                }
                console.error("Public Menu Critical Error:", err);
                setError(err.message || 'Erro desconhecido');
                toast.error(`Erro: ${err.message}`);
            } finally {
                // Only set loading false if we didn't abort (otherwise state update on unmounted component)
                setLoading(false);
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const mesa = urlParams.get('mesa');
        if (mesa) setInitialTable(mesa);

        fetchData();
    }, [slug]);

    // [NEW] Dynamic Title & Meta Tags for SEO/Social Share
    useEffect(() => {
        if (!restaurant) return;

        // Update Document Title
        const originalTitle = document.title;
        document.title = `${restaurant.name} | Menu Digital Jindungo`;

        // Update/Create Meta Tags
        const updateMeta = (name, content, isProperty = false) => {
            let meta = document.querySelector(`meta[${isProperty ? 'property' : 'name'}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                if (isProperty) meta.setAttribute('property', name);
                else meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        updateMeta('og:title', `${restaurant.name} - Menu Digital`, true);
        updateMeta('og:description', businessInfo?.share_text || `Veja o nosso menu completo e faça o seu pedido online no ${restaurant.name}.`, true);
        if (config?.logoUrl) updateMeta('og:image', config.logoUrl, true);
        updateMeta('og:url', window.location.href, true);
        updateMeta('og:type', 'website', true);

        return () => {
            document.title = originalTitle;
        };
    }, [restaurant, businessInfo, config]);

    const checkIsOpen = (info) => {
        if (!info || !info.opening_hours) return;

        const now = new Date();
        const daysPort = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const currentDay = daysPort[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const todayHours = info.opening_hours.find(h => h.day === currentDay);

        if (!todayHours || todayHours.closed) {
            setIsCurrentlyClosed(true);
            return;
        }

        const [openH, openM] = todayHours.open.split(':').map(Number);
        const [closeH, closeM] = todayHours.close.split(':').map(Number);
        const openTotal = openH * 60 + openM;
        const closeTotal = closeH * 60 + closeM;

        if (currentTime < openTotal || currentTime > closeTotal) {
            setIsCurrentlyClosed(true);
        } else {
            setIsCurrentlyClosed(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: restaurant?.name || 'Jindungo Menu',
            text: businessInfo?.share_text || 'Vem conhecer o nosso menu digital!',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast.success('Link copiado para a área de transferência!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        // Force re-run of effect by toggling a trigger or just calling fetchData if I extract it
        window.location.reload(); // Simple retry for now
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-gray-600 mb-6">{error === 'AbortError: signal is aborted without reason' ? 'A conexão foi interrompida. Por favor, tente novamente.' : error}</p>
                    <button
                        onClick={handleRetry}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
                    >
                        Tentar Novamente
                    </button>
                    {(error && error.includes('Abort')) && (
                        <p className="text-xs text-gray-400 mt-4">Dica: Verifique sua conexão com a internet.</p>
                    )}
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-100 flex justify-center sm:py-8">
                <div className="w-full sm:max-w-[480px] bg-white sm:rounded-[30px] sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 sm:h-[850px] relative ring-1 ring-gray-900/5 flex flex-col">

                    {/* [NEW] Closed Banner */}
                    {(isCurrentlyClosed || config.isOpen === false) && (
                        <div className="absolute top-0 left-0 right-0 z-[1000] bg-red-600 text-white px-4 py-3 text-center font-bold shadow-lg animate-pulse">
                            🚨 Restaurante Fechado no Momento
                            <p className="text-[10px] font-normal opacity-90">
                                {isCurrentlyClosed ? 'Estamos fora do horário de funcionamento.' : 'Apenas visualização. Pedidos temporariamente suspensos.'}
                            </p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto scrollbar-hide">

                        <LivePreview
                            config={config}
                            categories={categories}
                            isEditing={false}
                            isLoading={loading}
                            isFullPage={true} // It thinks it's full page, but it's contained
                            restaurantId={restaurant?.id}
                            features={features}
                        />
                    </div>

                    {/* Floating Elements (Hidden when Checkout is open) */}
                    {!isCheckoutOpen && (
                        <>
                            {/* Floating Cart Button - Hidden if closed */}
                            {config.isOpen !== false && (
                                <CartFloatingButton
                                    onClick={() => setIsCheckoutOpen(true)}
                                    primaryColor={config?.primaryColor}
                                    style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 999 }}
                                />
                            )}

                            {/* Waiter Button - Restricted by Plan AND isOpen */}
                            {features.canCallWaiter && config.isOpen !== false && (
                                <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2">
                                    <button
                                        onClick={async () => {
                                            let tableId = initialTable;

                                            if (!tableId) {
                                                const urlParams = new URLSearchParams(window.location.search);
                                                tableId = urlParams.get('mesa');
                                            }

                                            if (!tableId) {
                                                const userInput = window.prompt("Por favor, digite o número/nome ou letra da sua mesa para o garçom saber onde ir:");
                                                if (!userInput || userInput.trim() === '') {
                                                    toast.error("Identificação da mesa é necessária para chamar o garçom.");
                                                    return; // Cancel the request
                                                }
                                                tableId = userInput.trim();
                                            }

                                            const btn = document.getElementById('waiter-btn');
                                            if (btn) btn.classList.add('animate-ping');
                                            setTimeout(() => btn?.classList.remove('animate-ping'), 1000);

                                            try {
                                                const { error } = await supabase
                                                    .from('notificacoes_garcom')
                                                    .insert([{ mesa_id: tableId, status: 'pendente', restaurant_id: restaurant?.id }]);

                                                if (error) throw error;

                                                toast.success(`🔔 O garçom está a caminho da Mesa ${tableId}!`, {
                                                    duration: 4000,
                                                    position: 'top-center'
                                                });

                                            } catch (e) {
                                                console.error("Erro ao chamar garçom:", e);
                                                toast.error("Erro ao conectar com o serviço. Tente novamente.");
                                            }
                                        }}
                                        id="waiter-btn"
                                        className="w-16 h-16 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
                                        style={{
                                            backgroundColor: config?.primaryColor || '#D4AF37',
                                            boxShadow: `0 8px 32px ${config?.primaryColor}40`
                                        }}
                                        title="Chamar Garçom"
                                    >
                                        {/* Animated background glow */}
                                        <span className="absolute inset-0 bg-white/20 animate-pulse"></span>

                                        {/* Ripple focus effect */}
                                        <span className="absolute inset-0 rounded-full border-2 border-white/30 scale-90 group-hover:scale-150 group-hover:opacity-0 transition-all duration-700"></span>

                                        <BellRing size={28} className="text-white relative z-10 drop-shadow-lg" strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}

                            {/* Unified Action Group */}
                            <div className="fixed top-24 right-4 z-50 flex flex-col bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-in slide-in-from-right duration-500">
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-12 h-12 flex items-center justify-center text-[#FFD700] hover:bg-white/10 transition-all active:scale-95 border-b border-white/10"
                                    title="Reservar Mesa"
                                >
                                    <Calendar size={22} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => setShowInfo(true)}
                                    className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95 border-b border-white/10"
                                    title="Informações"
                                >
                                    <Info size={22} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"
                                    title="Partilhar"
                                >
                                    <Share2 size={22} strokeWidth={2.5} />
                                </button>
                            </div>
                        </>
                    )}

                    {/* [NEW] Loyalty Widget for Corporate users */}
                    {features.canCollectClientData && restaurant && (
                        <LoyaltyWidget
                            restaurantId={restaurant.id}
                            primaryColor={config?.primaryColor || '#D4AF37'}
                            darkMode={config?.darkMode}
                        />
                    )}

                    <CheckoutModal
                        isOpen={isCheckoutOpen}
                        onClose={() => setIsCheckoutOpen(false)}
                        restaurantId={restaurant?.id}
                        whatsappNumber={config?.whatsappNumber}
                        features={features}
                        initialTable={initialTable}
                        deliveryConfig={restaurant?.delivery_config}
                    />

                    <BookingModal
                        isOpen={showBookingModal}
                        onClose={() => setShowBookingModal(false)}
                        restaurantId={restaurant?.id}
                        restaurantName={restaurant?.name}
                    />

                    {/* [NEW] Info Overlay */}
                    {showInfo && (
                        <div className="absolute inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="w-full max-w-sm bg-[#121212] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-serif font-bold text-white">Sobre o Restaurante</h3>
                                        <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Hours */}
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0">
                                                <Clock size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Horário de Hoje</h4>
                                                <p className="text-sm text-gray-200">
                                                    {businessInfo?.opening_hours?.find(h => h.day === ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][new Date().getDay()])?.closed ? (
                                                        <span className="text-red-400 font-bold">Fechado</span>
                                                    ) : (
                                                        <span className="font-medium">
                                                            {businessInfo?.opening_hours?.find(h => h.day === ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][new Date().getDay()])?.open} - {businessInfo?.opening_hours?.find(h => h.day === ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][new Date().getDay()])?.close}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Localização</h4>
                                                <p className="text-sm text-gray-200 mb-2">{businessInfo?.location?.address || 'Consulte o nosso link abaixo.'}</p>
                                                {businessInfo?.location?.maps_link && (
                                                    <a
                                                        href={businessInfo.location.maps_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
                                                    >
                                                        Abrir no Google Maps <Share2 size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Socials */}
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                                                <Share2 size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Contactos & Redes</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {businessInfo?.socials?.phone && (
                                                        <a href={`tel:${businessInfo.socials.phone}`} className="p-2 bg-white/5 rounded-lg text-gray-300 hover:text-white">
                                                            <Phone size={18} />
                                                        </a>
                                                    )}
                                                    {businessInfo?.socials?.instagram && (
                                                        <a href={`https://instagram.com/${businessInfo.socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg text-gray-300 hover:text-white">
                                                            <Instagram size={18} />
                                                        </a>
                                                    )}
                                                    {businessInfo?.socials?.facebook && (
                                                        <a href={`https://facebook.com/${businessInfo.socials.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-lg text-gray-300 hover:text-white">
                                                            <Facebook size={18} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowInfo(false)}
                                        className="w-full mt-8 bg-white/10 text-white py-4 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all border border-white/5"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CartProvider>
    );
};

export default PublicMenu;

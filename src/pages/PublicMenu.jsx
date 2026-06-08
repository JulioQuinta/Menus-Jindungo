// Deployment Test V1.1 - 2026-03-15
import React, { useState, useEffect } from 'react';
import { getTranslation } from '../utils/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';



import { analyticsService } from '../services/analyticsService';
import LivePreview from '../components/LivePreview';
import { CartProvider } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import CartFloatingButton from '../components/CartFloatingButton';
import CheckoutModal from '../components/CheckoutModal';
import LoyaltyWidget from '../components/LoyaltyWidget';
import BookingModal from '../components/BookingModal';
import StaffPinModal from '../components/StaffPinModal';
import ActiveOrderTracker from '../components/ActiveOrderTracker';
import UpsellModal from '../components/UpsellModal';
import { useCart } from '../context/CartContext';
import { getPlanFeatures } from '../utils/planLimits';
import { Info, Share2, MapPin, Clock, Instagram, Facebook, Phone, X, Calendar, BellRing, Lock, ClipboardList } from 'lucide-react';

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
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(() => {
        if (slug) {
            return localStorage.getItem(`jindungo_checkout_open_${slug}`) === 'true';
        }
        return false;
    });
    const [coupons, setCoupons] = useState([]);
    const [initialTable, setInitialTable] = useState(null);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [isCurrentlyClosed, setIsCurrentlyClosed] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [activeStaff, setActiveStaff] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        return localStorage.getItem('jindungo_lang') || 'PT';
    });

    // Initial check for active staff session
    useEffect(() => {
        if (restaurant?.id) {
            const savedName = localStorage.getItem(`jindungo_staff_name_${restaurant.id}`);
            const savedId = localStorage.getItem(`jindungo_staff_id_${restaurant.id}`);
            if (savedName && savedId) {
                setActiveStaff({ id: savedId, name: savedName });
            }
        }
    }, [restaurant?.id]);

    // Persist whether checkout modal is open
    useEffect(() => {
        if (slug) {
            localStorage.setItem(`jindungo_checkout_open_${slug}`, isCheckoutOpen);
        }
    }, [slug, isCheckoutOpen]);

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
                analyticsService.trackView(restaurantData.id);

                // Persist restaurant slug mapping in localStorage
                if (restaurantData.slug) {
                    localStorage.setItem('jindungo_last_slug', restaurantData.slug);
                    localStorage.setItem(`jindungo_slug_${restaurantData.id}`, restaurantData.slug);
                }

                // Fetch public active coupons
                try {
                    const { data: couponsData } = await supabase
                        .from('coupons')
                        .select('*')
                        .eq('restaurant_id', restaurantData.id)
                        .eq('is_active', true);
                    setCoupons(couponsData || []);
                } catch (cErr) {
                    console.error("Error fetching coupons:", cErr);
                }

                // 2. Process Theme/Config (Now derived from Step 1)
                const themeData = restaurantData.theme_config || DEFAULT_CONFIG;
                const finalConfig = {
                    ...DEFAULT_CONFIG,
                    ...themeData,
                    restaurantName: restaurantData.name,
                    whatsappNumber: restaurantData.business_info?.socials?.phone || themeData.whatsappNumber
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
                        .map(item => ({
                            id: item.id,
                            restaurant_id: restaurantData.id, // [SECURITY] Guard against cross-restaurant cart mixing
                            name: item.name,
                            price: item.price,
                            desc: item.desc_text,
                            img: item.img_url,
                            subcategory: item.subcategory,
                            composition: item.composition, // [NEW]
                            isHighlight: item.is_highlight,
                            badge: item.badge,
                            track_stock: item.track_stock,
                            stock_quantity: item.stock_quantity,
                            upsell_ids: item.upsell_ids || [],
                            translations: {
                                pt: { 
                                    name: item.translations?.pt?.name || item.name, 
                                    desc: item.translations?.pt?.desc || item.desc_text, 
                                    composition: item.translations?.pt?.composition || item.composition 
                                },
                                en: { 
                                    name: item.translations?.en?.name || item.name, 
                                    desc: item.translations?.en?.desc || item.desc_text, 
                                    composition: item.translations?.en?.composition || item.composition 
                                },
                                fr: { 
                                    name: item.translations?.fr?.name || item.name, 
                                    desc: item.translations?.fr?.desc || item.desc_text, 
                                    composition: item.translations?.fr?.composition || item.composition 
                                },
                                es: { name: item.name, desc: item.desc_text, composition: item.composition },
                                ar: { name: item.name, desc: item.desc_text, composition: item.composition },
                                zh: { name: item.name, desc: item.desc_text, composition: item.composition },
                            }
                        }))
                }));

                setCategories(mappedCats);

                if (restaurantData.business_info) {
                    setBusinessInfo(restaurantData.business_info);
                    checkIsOpen(restaurantData.business_info);
                }

                setLoading(false);

            } catch (err) {
                // If it's an AbortError, it means the request was cancelled (e.g. unmount), ignore it.
                if (err.name === 'AbortError' || err.message?.includes('Abort')) {
                    console.log("Fetch aborted");
                    return;
                }
                console.error("Public Menu Critical Error:", err);
                setError(err.message || 'Erro desconhecido');
                toast.error(`Erro: ${err.message}`);
                setLoading(false);
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const mesa = urlParams.get('mesa');
        if (mesa) setInitialTable(mesa);

        fetchData();
    }, [slug]);

    // [NEW] Realtime Subscription para Disponibilidade dos Pratos
    useEffect(() => {
        if (!restaurant?.id) return;

        const channel = supabase.channel(`public-menu-${restaurant.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'menu_items',
                filter: `restaurant_id=eq.${restaurant.id}`
            }, (payload) => {
                const updatedItem = payload.new;
                
                // Atualiza a disponibilidade no estado local instantaneamente
                setCategories(prevCats => prevCats.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => 
                        item.id === updatedItem.id 
                            ? { ...item, available: updatedItem.available }
                            : item
                    )
                })));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurant?.id]);

    // [DYNAMIC FAVICON] Changes browser tab icon to the restaurant's logo
    useEffect(() => {
        if (!restaurant) return;

        const originalTitle = document.title;
        document.title = `${restaurant.name} | Menu Digital`;

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

        // Dynamic Favicon: switch to restaurant logo if available
        if (config?.logoUrl) {
            const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/png';
            const originalHref = favicon.href;
            favicon.href = config.logoUrl;
            if (!document.querySelector('link[rel="icon"]')) {
                document.head.appendChild(favicon);
            }
            return () => {
                favicon.href = originalHref;
                document.title = originalTitle;
            };
        }

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
            title: restaurant?.name || 'Menus Jindungo',
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
        window.location.reload(); 
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
        // Branded splash screen with the restaurant's logo (if already known) or a generic elegant loader
        const splashLogo = config?.logoUrl;
        const splashName = restaurant?.name;
        const splashColor = config?.primaryColor || '#D4AF37';
        const splashDark = config?.darkMode;

        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center"
                style={{ background: splashDark ? '#111' : '#f9f9f9' }}
            >
                {/* Animated ring behind logo */}
                <div className="relative flex items-center justify-center mb-6">
                    <span
                        className="absolute animate-ping rounded-full opacity-30"
                        style={{ width: 110, height: 110, backgroundColor: splashColor }}
                    />
                    <span
                        className="absolute animate-pulse rounded-full opacity-20"
                        style={{ width: 90, height: 90, backgroundColor: splashColor }}
                    />

                    {splashLogo ? (
                        <img
                            src={splashLogo}
                            alt={splashName || 'Logo'}
                            className="w-20 h-20 rounded-full object-cover border-4 shadow-2xl relative z-10"
                            style={{ borderColor: splashColor }}
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 shadow-2xl relative z-10"
                            style={{ borderColor: splashColor, backgroundColor: splashDark ? '#222' : '#fff' }}
                        >
                            🍽️
                        </div>
                    )}
                </div>

                {/* Restaurant name or generic text */}
                <p
                    className="text-lg font-bold tracking-widest animate-pulse"
                    style={{ color: splashColor }}
                >
                    {splashName || 'A carregar menu...'}
                </p>
                <p className="text-xs mt-2 opacity-40" style={{ color: splashDark ? '#aaa' : '#555' }}>
                    Menu Digital
                </p>
            </div>
        );
    }

    return (
        <CartProvider>
            <PublicMenuInner 
                slug={slug}
                restaurant={restaurant}
                features={features}
                config={config}
                categories={categories}
                loading={loading}
                error={error}
                isCheckoutOpen={isCheckoutOpen}
                setIsCheckoutOpen={setIsCheckoutOpen}
                initialTable={initialTable}
                businessInfo={businessInfo}
                isCurrentlyClosed={isCurrentlyClosed}
                showInfo={showInfo}
                setShowInfo={setShowInfo}
                showBookingModal={showBookingModal}
                setShowBookingModal={setShowBookingModal}
                showStaffModal={showStaffModal}
                setShowStaffModal={setShowStaffModal}
                activeStaff={activeStaff}
                setActiveStaff={setActiveStaff}
                handleShare={handleShare}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                coupons={coupons}
            />
        </CartProvider>
    );
};
const PublicMenuInner = ({ 
    restaurant, features, config, categories, loading, 
    isCheckoutOpen, setIsCheckoutOpen, initialTable, businessInfo, 
    isCurrentlyClosed, showInfo, setShowInfo, showBookingModal, 
    setShowBookingModal, showStaffModal, setShowStaffModal, 
    activeStaff, setActiveStaff, handleShare,
    selectedLanguage, setSelectedLanguage,
    coupons
}) => {
    const navigate = useNavigate();
    const { addToCart, cartItems, clearCart } = useCart();
    const t = (key) => getTranslation(selectedLanguage, key);
    const [upsellState, setUpsellState] = useState({ isOpen: false, mainItem: null, upsellItems: [] });
    const [recentOrders, setRecentOrders] = useState([]);
    const [showRecentOrders, setShowRecentOrders] = useState(false);

    useEffect(() => {
        if (!restaurant?.id) return;
        const loadRecentOrders = () => {
            try {
                const orders = JSON.parse(localStorage.getItem(`jindungo_client_orders_${restaurant.id}`) || '[]');
                setRecentOrders(orders);
            } catch (e) {
                console.error("Error loading recent orders", e);
            }
        };
        loadRecentOrders();
        window.addEventListener('jindungo_orders_updated', loadRecentOrders);
        window.addEventListener('jindungo_new_order', loadRecentOrders);
        return () => {
            window.removeEventListener('jindungo_orders_updated', loadRecentOrders);
            window.removeEventListener('jindungo_new_order', loadRecentOrders);
        };
    }, [restaurant?.id]);

    // [NEW] Cart Recovery via URL Param
    useEffect(() => {
        if (!restaurant?.id || categories.length === 0) return;

        const urlParams = new URLSearchParams(window.location.search);
        const recoverParam = urlParams.get('recover');
        if (!recoverParam) return;

        // Prevent infinite loops by removing the parameter from the URL bar immediately
        const newUrl = window.location.pathname + (initialTable ? `?mesa=${initialTable}` : '');
        window.history.replaceState({}, document.title, newUrl);

        import('../utils/whatsappGenerator.js').then(({ deserializeCart }) => {
            const recovered = deserializeCart(recoverParam);
            if (!recovered) return;

            // Clear current cart first
            clearCart();

            // Find matching items in loaded categories to populate full details
            const allItems = categories.flatMap(cat => cat.items);
            let addedCount = 0;

            recovered.cartItems.forEach(recItem => {
                const dbItem = allItems.find(i => String(i.id) === String(recItem.id));
                if (dbItem) {
                    for (let q = 0; q < recItem.quantity; q++) {
                        addToCart(dbItem, recItem.selectedVariant);
                        addedCount++;
                    }
                }
            });

            if (addedCount > 0) {
                // Populate checkout form draft in localStorage
                const draft = {
                    step: 3, // Go directly to step 3 (Payment)
                    orderType: recovered.orderType || 'delivery',
                    customerName: recovered.details.customerName || '',
                    customerPhone: recovered.details.customerPhone || '',
                    tableNumber: recovered.details.tableNumber || '',
                    address: recovered.details.address || '',
                    addressReference: recovered.details.addressReference || '',
                    geolocationMode: recovered.details.geolocationMode || 'app_gps',
                    paymentMethod: 'cash'
                };
                localStorage.setItem(`jindungo_checkout_draft_${restaurant.id}`, JSON.stringify(draft));
                
                // Open checkout modal
                setIsCheckoutOpen(true);
                toast.success(
                    selectedLanguage === 'PT'
                        ? 'Carrinho e dados do pedido restaurados com sucesso!'
                        : 'Cart and order details restored successfully!',
                    { icon: '🛒', duration: 4000 }
                );
            }
        }).catch(err => {
            console.error("Failed to recover cart:", err);
        });
    }, [restaurant?.id, categories, selectedLanguage, initialTable, addToCart, clearCart, setIsCheckoutOpen]);

    // [SECURITY] Validação rigorosa de Sessão / Mesa contra mistura de restaurantes no carrinho
    useEffect(() => {
        if (restaurant?.id && cartItems.length > 0) {
            const firstItem = cartItems[0];
            if (firstItem.restaurant_id && String(firstItem.restaurant_id) !== String(restaurant.id)) {
                clearCart();
                toast.error(
                    selectedLanguage === 'PT' 
                        ? 'Carrinho limpo: Iniciou sessão num novo restaurante.' 
                        : 'Cart cleared: Switched to a different restaurant.',
                    { duration: 5000, icon: '⚠️' }
                );
            }
        }
    }, [restaurant?.id, cartItems, clearCart, selectedLanguage]);

    const handleItemAdded = (item) => {
        if (item.upsell_ids && item.upsell_ids.length > 0) {
            const items = categories.flatMap(c => c.items).filter(i => item.upsell_ids.includes(i.id));
            if (items.length > 0) {
                setUpsellState({ isOpen: true, mainItem: item, upsellItems: items });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center sm:py-8 overflow-x-hidden w-full max-w-[100vw]">
            <div className="w-full sm:max-w-[380px] bg-white sm:rounded-[30px] sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 sm:h-[812px] relative ring-1 ring-gray-900/5 flex flex-col max-w-[100vw]">

                {(isCurrentlyClosed || config.isOpen === false) && (
                    <div className="absolute top-0 left-0 right-0 z-[1000] bg-red-600 text-white px-4 py-3 text-center font-bold shadow-lg animate-pulse">
                        🚨 Restaurante Fechado no Momento
                        <p className="text-[10px] font-normal opacity-90">
                            {isCurrentlyClosed ? 'Estamos fora do horário de funcionamento.' : 'Apenas visualização. Pedidos temporariamente suspensos.'}
                        </p>
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto scrollbar-hide ${(isCurrentlyClosed || config.isOpen === false) ? 'pt-[56px]' : ''}`}>

                    <LivePreview 
                        config={config} 
                        categories={categories} 
                        isEditing={false} 
                        isLoading={loading} 
                        restaurantId={restaurant?.id}
                        features={features}
                        onItemAdded={(item) => {
                            handleItemAdded(item);
                        }}
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                        coupons={coupons}
                        restaurantClosed={isCurrentlyClosed || config.isOpen === false}
                    />
                </div>

                    {!isCheckoutOpen && (
                        <>
                            {config.isOpen !== false && !isCurrentlyClosed && (
                                <CartFloatingButton
                                    onClick={() => {
                                        setIsCheckoutOpen(true);
                                        analyticsService.trackCheckoutStart(restaurant?.id, cartItems);
                                    }}
                                    primaryColor={config?.primaryColor}
                                    style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 999 }}
                                />
                            )}

                            {features.canCallWaiter && config.isOpen !== false && !isCurrentlyClosed && (
                                <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2">
                                    <button
                                        onClick={async () => {
                                            let tableId = initialTable;
                                            if (!tableId) {
                                                const urlParams = new URLSearchParams(window.location.search);
                                                tableId = urlParams.get('mesa');
                                            }
                                            if (!tableId) {
                                                const userInput = window.prompt("Por favor, digite o número/nome ou letra da sua mesa para o empregado de mesa saber onde ir:");
                                                if (!userInput || userInput.trim() === '') {
                                                    toast.error("A identificação da mesa é necessária para chamar o atendimento.");
                                                    return;
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
                                                toast.success(`🔔 O empregado de mesa está a caminho da Mesa ${tableId}!`, {
                                                    duration: 4000,
                                                    position: 'top-center'
                                                });
                                            } catch (e) {
                                                console.error("Erro ao chamar mesa:", e);
                                                toast.error("Erro ao conectar com o serviço. Tente novamente.");
                                            }
                                        }}
                                        id="waiter-btn"
                                        className="w-16 h-16 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
                                        style={{
                                            backgroundColor: config?.primaryColor || '#D4AF37',
                                            boxShadow: `0 8px 32px ${config?.primaryColor}40`
                                        }}
                                        title="Chamar Empregado de Mesa"
                                    >
                                        <span className="absolute inset-0 bg-white/20 animate-pulse"></span>
                                        <span className="absolute inset-0 rounded-full border-2 border-white/30 scale-90 group-hover:scale-150 group-hover:opacity-0 transition-all duration-700"></span>
                                        <BellRing size={28} className="text-white relative z-10 drop-shadow-lg" strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}

                            <div className="fixed top-24 right-4 z-50 flex flex-col bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden animate-in slide-in-from-right duration-500">
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="w-12 h-12 flex items-center justify-center text-[#FFD700] hover:bg-white/10 transition-all active:scale-95 border-b border-white/10"
                                    title="Reservar Mesa"
                                >
                                    <Calendar size={22} strokeWidth={2.5} />
                                </button>
                                {features.canManageStaff && (
                                    <button
                                        onClick={() => setShowStaffModal(true)}
                                        className={`w-12 h-12 flex items-center justify-center transition-all active:scale-95 border-b border-white/10 ${activeStaff ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                        title={activeStaff ? `Sessão: ${activeStaff.name}` : 'Acesso Equipa / PDV'}
                                    >
                                        <Lock size={22} strokeWidth={2.5} />
                                    </button>
                                )}
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
                                {recentOrders.length > 0 && (
                                    <button
                                        onClick={() => setShowRecentOrders(true)}
                                        className="w-12 h-12 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all active:scale-95 border-t border-white/10"
                                        title="Meus Pedidos"
                                    >
                                        <ClipboardList size={22} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {features.canCollectClientData && restaurant && (
                        <LoyaltyWidget
                            restaurantId={restaurant.id}
                            primaryColor={config?.primaryColor || '#D4AF37'}
                            darkMode={config?.darkMode}
                        />
                    )}

                    <ActiveOrderTracker restaurantId={restaurant?.id} restaurantName={restaurant?.name} primaryColor={config?.primaryColor} />

                    <CheckoutModal
                        isOpen={isCheckoutOpen}
                        onClose={() => setIsCheckoutOpen(false)}
                        restaurantId={restaurant?.id}
                        restaurantSlug={restaurant?.slug}
                        whatsappNumber={config?.whatsappNumber}
                        features={features}
                        initialTable={initialTable}
                        deliveryConfig={restaurant?.delivery_config}
                        activeStaff={activeStaff}
                        selectedLanguage={selectedLanguage}
                        restaurantClosed={isCurrentlyClosed || config.isOpen === false}
                    />

                    <BookingModal
                        isOpen={showBookingModal}
                        onClose={() => setShowBookingModal(false)}
                        restaurantId={restaurant?.id}
                        restaurantName={restaurant?.name}
                        whatsappNumber={config?.whatsappNumber}
                        selectedLanguage={selectedLanguage}
                    />

                    <StaffPinModal
                    isOpen={showStaffModal}
                    onClose={() => setShowStaffModal(false)}
                    restaurantId={restaurant?.id}
                    onLogin={(staff) => setActiveStaff(staff)}
                />

                {showRecentOrders && (
                    <div className="absolute inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="w-full max-w-sm bg-[#121212] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-serif font-bold text-white">Os Meus Pedidos 🌶️</h3>
                                    <button onClick={() => setShowRecentOrders(false)} className="text-gray-400 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {recentOrders.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-6">Nenhum pedido recente encontrado.</p>
                                    ) : (
                                        recentOrders.map((ord) => (
                                            <div key={ord.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3 animate-fade-in">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <span className="text-[10px] font-mono text-[#D4AF37] font-bold">
                                                            #{String(ord.id).slice(0, 8).toUpperCase()}
                                                        </span>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {new Date(ord.timestamp).toLocaleDateString('pt-PT')} às {new Date(ord.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <p className="text-xs text-white font-bold mt-1">
                                                            Total: {new Intl.NumberFormat('pt-AO').format(ord.total)} Kz
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <button
                                                        onClick={() => {
                                                            localStorage.setItem(`jindungo_active_order_${restaurant.id}`, JSON.stringify({
                                                                id: ord.id,
                                                                timestamp: ord.timestamp
                                                            }));
                                                            window.dispatchEvent(new Event('jindungo_new_order'));
                                                            setShowRecentOrders(false);
                                                            toast.success("Resumo reativado no rodapé!", { icon: '🛎️' });
                                                        }}
                                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 border border-white/5 text-center"
                                                    >
                                                        Resumo no rodapé 🛎️
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowRecentOrders(false);
                                                            navigate(`/track/${ord.id}`);
                                                        }}
                                                        className="flex-1 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-gray-950 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 text-center"
                                                    >
                                                        Ver Detalhes 🛵
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowRecentOrders(false)}
                                    className="w-full mt-6 bg-white/10 text-white py-4 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all border border-white/5"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <UpsellModal 
                    isOpen={upsellState.isOpen}
                    onClose={() => setUpsellState({ ...upsellState, isOpen: false })}
                    mainItem={upsellState.mainItem}
                    upsellItems={upsellState.upsellItems}
                    primaryColor={config?.primaryColor}
                    darkMode={config?.darkMode}
                    onAddUpsell={(item) => {
                        addToCart(item);
                        toast.success(`${item.name} adicionado!`, { icon: '✨' });
                    }}
                />

                    {showInfo && (
                        <div className="absolute inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="w-full max-w-sm bg-[#121212] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-serif font-bold text-white">{t('aboutRestaurant')}</h3>
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
                                                <h4 className="text-[10px] font-display text-gray-500 mb-1.5">{t('openingHours')}</h4>
                                                <p className="text-sm font-sans text-gray-200">
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
                                                <h4 className="text-[10px] font-display text-gray-500 mb-1.5">{t('location')}</h4>
                                                <p className="text-sm font-sans text-gray-200 mb-2">{businessInfo?.location?.address || 'Consulte o nosso link abaixo.'}</p>
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
                                                <h4 className="text-[10px] font-display text-gray-500 mb-1.5">{t('contactsSocials')}</h4>
                                                <div className="flex flex-wrap gap-3 mb-3">
                                                    {businessInfo?.socials?.phone && (
                                                        <a href={`tel:${businessInfo.socials.phone}`} className="p-2 bg-white/5 rounded-lg text-gray-300 hover:text-white" title="Ligar">
                                                            <Phone size={18} />
                                                        </a>
                                                    )}
                                                    {config?.whatsappNumber && (
                                                        <button 
                                                            onClick={() => {
                                                                let cleanPhone = config.whatsappNumber.replace(/\D/g, '');
                                                                if (cleanPhone.length === 9) cleanPhone = '244' + cleanPhone;
                                                                window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                                            }}
                                                            className="p-2 bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-lg hover:bg-[#25D366]/30 hover:text-[#25D366] transition-colors flex items-center gap-1.5"
                                                            title="WhatsApp"
                                                        >
                                                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Chat</span>
                                                        </button>
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
                                        {t('back')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
        </div>
    </div>
    );
};

export default PublicMenu;

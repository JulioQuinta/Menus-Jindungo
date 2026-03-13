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
import { getPlanFeatures } from '../utils/planLimits';

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

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch Restaurant
                const normalizedSlug = slug.trim().replace(/\s+/g, '-');
                console.log("Step 1: Fetching Restaurant with slug:", normalizedSlug);

                const { data: restaurants, error: rError } = await supabase
                    .from('restaurants')
                    .select('id, name, slug, status, plan, delivery_config')
                    .eq('slug', normalizedSlug);

                if (rError) throw new Error(`Erro ao buscar restaurante: ${rError.message}`);
                const restaurantData = restaurants?.[0];
                if (!restaurantData) throw new Error('Restaurante não encontrado (404)');

                setRestaurant(restaurantData);
                setFeatures(getPlanFeatures(restaurantData.plan));

                // 2. Fetch Theme (Sequential)
                // 2. Fetch Theme (Sequential)
                console.log("Step 2: Fetching Theme...");
                let themeData = DEFAULT_CONFIG;
                try {
                    themeData = await themeService.getTheme(restaurantData.id);
                } catch (tErr) {
                    console.error("Theme fetch failed, using default", tErr);
                }

                // [FIX] Merge restaurant name into config
                const finalConfig = {
                    ...(themeData || DEFAULT_CONFIG),
                    restaurantName: restaurantData.name // Ensure name is passed
                };

                setConfig(finalConfig);

                // 3. Fetch Menu (Sequential)
                console.log("Step 3: Fetching Menu...");
                let menuData = [];
                try {
                    menuData = await menuService.getMenuCategories(restaurantData.id);
                } catch (mErr) {
                    throw new Error(`Erro ao buscar menu: ${mErr.message}`);
                }
                setCategories(menuData || []);

            } catch (err) {
                console.error("Public Menu Critical Error:", err);
                setError(err.message || 'Erro desconhecido');
                toast.error(`Erro: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const mesa = urlParams.get('mesa');
        if (mesa) setInitialTable(mesa);

        fetchData();
    }, [slug]);

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
                            {/* Floating Cart Button */}
                            <CartFloatingButton
                                onClick={() => setIsCheckoutOpen(true)}
                                primaryColor={config?.primaryColor}
                                style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 999 }}
                            />

                            {/* Waiter Button - Restricted by Plan */}
                            {features.canCallWaiter && (
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
                                        className="w-14 h-14 bg-white rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-all border border-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-white"
                                        style={{ color: config?.primaryColor || '#D4AF37' }}
                                        title="Chamar Garçom"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse-slow">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
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
                </div>
            </div>
        </CartProvider>
    );
};

export default PublicMenu;

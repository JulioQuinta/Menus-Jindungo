import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    UtensilsCrossed,
    ClipboardList,
    Users,
    Settings,
    LogOut,
    QrCode,
    Menu as MenuIcon,
    MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Components
import DashboardStats from '../components/DashboardStats';
import MenuManager from '../components/MenuManager';
import KitchenBoard from '../components/KitchenBoard';
import CategoryManager from '../components/CategoryManager';
import StyleControls from '../components/StyleControls';
import ChatAdminPanel from '../components/ChatAdminPanel';
import InstallPWA from '../components/InstallPWA';
import QRCodeGenerator from '../components/QRCodeGenerator';

// Placeholder for Client Manager
const ClientManager = () => (
    <div className="p-6 bg-white rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">Gerenciar Clientes / Staff</h2>
        <p className="text-gray-500">Funcionalidade de adicionar clientes será implementada aqui.</p>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Adicionar Cliente
        </button>
    </div>
);

const AdminDashboard = () => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Data State
    const [restaurant, setRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // [NEW] Alerts State
    const [activeAlerts, setActiveAlerts] = useState([]);

    // [NEW] Global Notifications State
    const [globalNotifications, setGlobalNotifications] = useState([]);

    // Fetch Global Notifications
    useEffect(() => {
        const fetchGlobalNotifications = async () => {
            try {
                const { data } = await supabase
                    .from('system_notifications')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (data) setGlobalNotifications(data);
            } catch (error) {
                console.error("Error fetching global notifications", error);
            }
        };

        fetchGlobalNotifications();

        // Listen for new global notifications
        const channel = supabase
            .channel('global-notifs')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_notifications' },
                () => {
                    fetchGlobalNotifications(); // Simply refetch on any change
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // [NEW] Realtime Listener
    useEffect(() => {
        if (!restaurant) return;

        const waiterChannel = supabase
            .channel('waiter-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificacoes_garcom',
                    filter: `restaurant_id=eq.${restaurant.id}`
                },
                (payload) => {
                    // Play Sound Safely
                    try {
                        const audio = new Audio('/bell.mp3');
                        audio.play().catch(e => console.log("Audio autoplay blocked", e));
                    } catch (err) {
                        console.log("Audio error", err);
                    }

                    setActiveAlerts(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        const ordersChannel = supabase
            .channel('new-orders-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurant.id}`
                },
                (payload) => {
                    // Play Sound Safely
                    try {
                        const audio = new Audio('/bell.mp3');
                        audio.play().catch(e => console.log("Audio autoplay blocked", e));
                    } catch (err) {
                        console.log("Audio error", err);
                    }

                    const newOrderAlert = {
                        id: `order-${payload.new.id}`,
                        isOrder: true,
                        mesa_id: 'Online',
                        request_type: `De: ${payload.new.customer_name || 'Cliente Desconhecido'}`,
                        created_at: payload.new.created_at
                    };
                    setActiveAlerts(prev => [...prev, newOrderAlert]);
                }
            )
            .subscribe();

        // Also fetch existing pending alerts on load
        const fetchPending = async () => {
            const { data } = await supabase
                .from('notificacoes_garcom')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pendente');
            if (data) setActiveAlerts(data);
        };
        fetchPending();

        return () => {
            supabase.removeChannel(waiterChannel);
            supabase.removeChannel(ordersChannel);
        };
    }, [restaurant]);

    const handleDismissAlert = async (id) => {
        const alertToDismiss = activeAlerts.find(a => a.id === id);

        // Optimistic Remove
        setActiveAlerts(prev => prev.filter(a => a.id !== id));

        if (alertToDismiss && alertToDismiss.isOrder) {
            navigate('/admin/orders');
        } else {
            // DB Update for Waiter Alerts
            await supabase
                .from('notificacoes_garcom')
                .update({ status: 'atendido' })
                .eq('id', id);
        }
    };

    // Config State (lifted from StyleControls/LivePreview)
    const [config, setConfig] = useState({
        primaryColor: '#e53e3e',
        fontFamily: 'Inter, sans-serif',
        layoutMode: 'list',
        darkMode: false,
        whatsappNumber: '',
        logoUrl: ''
    });

    useEffect(() => {
        if (user) {
            fetchRestaurantData();
        }
    }, [user]);

    const fetchRestaurantData = async () => {
        try {
            setLoading(true);

            // [NEW] Check for masquerade mode (Super Admin feature)
            const masqueradeId = localStorage.getItem('masquerade_restaurant_id');

            let query = supabase.from('restaurants').select('*');
            if (masqueradeId) {
                query = query.eq('id', masqueradeId);
            } else {
                query = query.eq('owner_id', user.id);
            }

            // 1. Get Restaurant associated with user (or masqueraded)
            const { data: restaurants, error: rError } = await query;

            if (rError) throw rError;

            let currentRestaurant = restaurants?.[0];

            if (!currentRestaurant) {
                console.warn("No restaurant found for user. Creating default...");
                // Free Trial logic: 7 days default
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 7);

                const { data: newRest, error: insertError } = await supabase
                    .from('restaurants')
                    .insert([{
                        owner_id: user.id,
                        name: '',
                        slug: `novo-restaurante-${Date.now().toString().slice(-6)}`,
                        plan: 'Free Trial',
                        valid_until: trialEndDate.toISOString(),
                        theme_config: {
                            primaryColor: '#D4AF37',
                            fontFamily: 'Inter, sans-serif',
                            layoutMode: 'list',
                            darkMode: false,
                            whatsappNumber: '',
                            logoUrl: ''
                        }
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error("Failed to create default restaurant:", insertError);
                } else {
                    setRestaurant(newRest);
                    setConfig(newRest.theme_config);
                    setCategories([]);
                }
            } else {
                setRestaurant(currentRestaurant);
                // Parse config if it exists in DB, otherwise keep defaults
                if (currentRestaurant.theme_config) {
                    setConfig(prev => ({ ...prev, ...currentRestaurant.theme_config }));
                }

                // 2. Get Categories & Items
                const { data: cats, error: cError } = await supabase
                    .from('categories')
                    .select('*, items:menu_items(*)')
                    .eq('restaurant_id', currentRestaurant.id)
                    .order('sort_order');

                if (cError) throw cError;
                setCategories(cats || []);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = async (newConfig) => {
        // Optimistic update
        const updated = typeof newConfig === 'function' ? newConfig(config) : newConfig;
        setConfig(updated);

        // Debounced save to DB would go here
        if (restaurant) {
            const { error } = await supabase
                .from('restaurants')
                .update({ theme_config: updated })
                .eq('id', restaurant.id);

            if (error) throw error; // Throw to be caught by caller
        }
    };

    // [NEW] Handle Name Update (for Demo purposes)
    const handleNameUpdate = async (newName) => {
        if (!restaurant) return;

        // Optimistic
        setRestaurant(prev => ({ ...prev, name: newName }));

        await supabase
            .from('restaurants')
            .update({ name: newName })
            .eq('id', restaurant.id);
    };

    // [NEW] Handle Slug Update
    const handleSlugUpdate = async (newSlug) => {
        if (!restaurant || !newSlug) return false;

        // Format slug: lowercase, replace spaces with hyphens, remove special chars
        const formattedSlug = newSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        if (formattedSlug === restaurant.slug) return true; // No change

        try {
            // 1. Check if slug exists
            const { data: existing } = await supabase
                .from('restaurants')
                .select('id')
                .eq('slug', formattedSlug)
                .maybeSingle();

            if (existing) {
                alert("Este link já está em uso por outro restaurante. Por favor, escolha outro.");
                return false;
            }

            // 2. Update if unique
            const { error } = await supabase
                .from('restaurants')
                .update({ slug: formattedSlug })
                .eq('id', restaurant.id);

            if (error) throw error;

            // Update local state
            setRestaurant(prev => ({ ...prev, slug: formattedSlug }));
            alert("Link do menu atualizado com sucesso!");
            return true;
        } catch (error) {
            console.error("Error updating slug:", error);
            alert("Erro ao atualizar o link. Tente novamente.");
            return false;
        }
    };

    // [NEW] Handle Logo Upload (Supabase Storage)
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !restaurant) return;

        // SIZE LIMIT CHECK (5MB max for storage)
        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem é muito grande! Por favor, use um arquivo menor que 5MB.");
            return;
        }

        try {
            // Display loading/saving state could be added here
            const fileExt = file.name.split('.').pop();
            const fileName = `logos/${restaurant.id}/logo_${Date.now()}.${fileExt}`;

            // Upload to 'marcas' or 'menus' bucket (Assuming we use 'menus' for now, or if 'marcas' exists we should use it. 
            // We used 'menus' in MenuManager, we can use the same bucket but a different folder).
            const { error: uploadError } = await supabase.storage.from('menus').upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);

            if (!publicUrl) throw new Error("Falha ao obter URL pública");

            // Update Config with new URL
            const newConfig = { ...config, logoUrl: publicUrl };
            await handleConfigChange(newConfig);

            alert("Logotipo atualizado com sucesso!");
        } catch (error) {
            console.error('Error saving logo:', error);
            alert(`Erro ao salvar logotipo: ${error.message}`);
        }
    };

    const handleMenuUpdate = () => {
        fetchRestaurantData(); // Refresh data
    };

    const isActive = (path) => location.pathname.includes(path);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Visão Geral', path: '/admin' },
        { icon: MessageSquare, label: 'Assistente IA', path: '/admin/chat' },
        { icon: UtensilsCrossed, label: 'Menu Digital', path: '/admin/menu' },
        { icon: ClipboardList, label: 'Pedidos (Cozinha)', path: '/admin/orders' },
        { icon: Users, label: 'Clientes / Staff', path: '/admin/clients' },
        { icon: QrCode, label: 'QR Code', path: '/admin/qrcode' },
        { icon: Settings, label: 'Configurações', path: '/admin/settings' },
    ];

    const isExpired = restaurant?.valid_until ? new Date(restaurant.valid_until) < new Date() : false;

    if (loading) return (
        <div className="flex bg-[#121212] flex-col h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mb-4"></div>
            <p className="text-gray-400 font-mono text-sm animate-pulse">Verificando Credenciais SaaS...</p>
        </div>
    );

    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden text-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-900/10 blur-[150px] animate-pulse-slow"></div>
                </div>

                <div className="relative z-10 glass-dark border border-white/10 rounded-3xl p-6 sm:p-10 max-w-lg shadow-2xl backdrop-blur-xl w-full">
                    <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                        <span className="text-4xl drop-shadow-lg">🔒</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 tracking-tight">Acesso Suspenso</h1>
                    <p className="text-gray-400 mb-8 border-b border-white/10 pb-6 text-sm sm:text-base leading-relaxed">
                        O prazo de utilização do painel do <span className="text-[#D4AF37] font-bold">"{restaurant.name}"</span> terminou.
                        A sua ementa pública vai ser mantida off-line até regularização.
                    </p>

                    <div className="bg-black/50 rounded-2xl p-5 sm:p-6 border border-white/5 mb-8 text-left shadow-inner">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
                            <span>Como Renovar (+30 Dias)</span>
                            <span className="text-[#D4AF37]">🇦🇴</span>
                        </p>

                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <span className="bg-[#D4AF37]/20 text-[#D4AF37] font-bold px-2 py-0.5 rounded text-xs mt-0.5 border border-[#D4AF37]/30">1</span>
                                <div>
                                    <p className="text-sm text-gray-300 font-medium">Faça Transferência via Multicaixa ou Depósito Bancário para:</p>
                                    <div className="mt-2 bg-gradient-to-r from-white/5 to-transparent p-3 rounded-xl border-l-[3px] border-[#D4AF37] font-mono text-sm shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center" title="Copiar IBAN">📋</div>
                                        <span className="text-gray-500 block text-[10px] tracking-widest uppercase mb-1">IBAN Jindungo Angola</span>
                                        <span className="text-[#D4AF37] font-bold text-base tracking-wider">AO06 0000 0000 0000 0000 0</span>
                                        <p className="text-[10px] text-gray-500 mt-1">Titular: Jindungo Software, Lda.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="bg-[#D4AF37]/20 text-[#D4AF37] font-bold px-2 py-0.5 rounded text-xs mt-0.5 border border-[#D4AF37]/30">2</span>
                                <div>
                                    <p className="text-sm text-gray-300 font-medium mt-1">Envie o comprovativo pelo WhatsApp de Suporte.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <a
                            href="https://wa.me/244900000000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(22,163,74,0.25)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                            <span className="tracking-wide">Reportar Pagamento via WhatsApp</span>
                        </a>
                        <button
                            onClick={signOut}
                            className="w-full bg-transparent hover:bg-white/5 text-gray-400 font-medium py-3 rounded-xl transition-all border border-transparent hover:border-white/10 uppercase tracking-widest text-xs"
                        >
                            Sair da Conta (Logout)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#121212] text-gray-100 overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px]"></div>
            </div>

            {/* Sidebar */}
            <aside className={`relative z-20 glass-dark border-r border-white/5 transition-all duration-500 ease-spring ${isSidebarOpen ? 'w-72' : 'w-24'} flex flex-col shadow-2xl`}>
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className={`flex items-center gap-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-yellow-200 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] transform hover:scale-105 transition-transform cursor-pointer">
                            <span className="font-serif font-bold text-black text-xl">M</span>
                        </div>
                        <span className="font-serif text-2xl font-bold text-white tracking-tight cursor-pointer">
                            Jindu<span className="text-[#D4AF37]">ngo</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 hover:bg-white/10 rounded-xl transition-all ${!isSidebarOpen && 'mx-auto'}`}
                    >
                        <MenuIcon size={20} className="text-gray-400 hover:text-white" />
                    </button>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto scrollbar-hide mt-4">
                    {menuItems.map((item) => {
                        const active = item.path === '/admin' ? location.pathname === '/admin' : isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 relative overflow-hidden ${active
                                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(212,175,55,0.1)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-6'
                                    }`}
                            >
                                <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'group-hover:scale-110'}`}>
                                    <item.icon size={22} className={active ? "" : ""} />
                                </div>
                                <span className={`font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 absolute'}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#D4AF37] rounded-l-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 mt-auto">
                    <button
                        onClick={signOut}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-500/20 transition-all group ${!isSidebarOpen && 'justify-center border border-transparent'}`}
                    >
                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                        <span className={`${isSidebarOpen ? 'block' : 'hidden'} font-medium`}>Terminar Sessão</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 bg-[#121212]">


                {/* [NEW] Waiter & Order Alerts Section */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 pointer-events-none">
                    {/* We make the container pointer-events-none so it doesn't block clicks, but children will be auto */}
                    {activeAlerts.map(alert => (
                        <div key={alert.id} className={`pointer-events-auto text-white p-4 rounded-xl shadow-2xl border-2 animate-bounce flex items-center justify-between ${alert.isOrder ? 'bg-green-600 border-green-400' : 'bg-red-600 border-red-400'}`}>
                            <div>
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                    {alert.isOrder ? '🛍️ Novo Pedido' : `🔔 Mesa ${alert.mesa_id}`}
                                </h4>
                                <p className={`text-xs ${alert.isOrder ? 'text-green-100' : 'text-red-100'}`}>
                                    {alert.isOrder ? alert.request_type : 'Chamou o garçom!'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDismissAlert(alert.id)}
                                className={`bg-white px-3 py-1 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-colors shadow-sm ${alert.isOrder ? 'text-green-600' : 'text-red-600'}`}
                            >
                                {alert.isOrder ? 'Ver' : 'Atendido'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* [NEW] Masquerade Warning Banner */}
                {localStorage.getItem('masquerade_restaurant_id') && (
                    <div className="bg-red-600/90 text-white px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-40 backdrop-blur-md border-b border-red-500/50">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span className="text-xl">🕵️‍♂️</span> Você está no MODO FANTASMA - A ver o painel de: {restaurant?.name}
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('masquerade_restaurant_id');
                                window.location.href = '/super-admin';
                            }}
                            className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            Sair e Voltar ao Super Admin
                        </button>
                    </div>
                )}

                {/* [NEW] Global Notifications Banner */}
                {globalNotifications.map(notif => (
                    <div
                        key={notif.id}
                        className={`px-4 py-3 flex items-start gap-3 shadow-lg sticky top-0 z-40 backdrop-blur-md border-b text-sm font-medium ${notif.type === 'danger' ? 'bg-red-900/90 text-white border-red-500/50' :
                            notif.type === 'warning' ? 'bg-orange-600/90 text-white border-orange-500/50' :
                                notif.type === 'success' ? 'bg-green-700/90 text-white border-green-500/50' :
                                    'bg-blue-800/90 text-white border-blue-500/50'
                            }`}
                        // Adjusting top position if masquerade banner is active so they stack
                        style={{ marginTop: localStorage.getItem('masquerade_restaurant_id') ? '0' : '0' }}
                    >
                        <span className="text-xl mt-0.5">
                            {notif.type === 'danger' ? '🚨' : notif.type === 'warning' ? '⚠️' : notif.type === 'success' ? '🎉' : 'ℹ️'}
                        </span>
                        <div className="flex-1">
                            <strong className="block mb-0.5 uppercase tracking-wider text-[10px] opacity-80">
                                Mensagem da Administração Jindungo
                            </strong>
                            {notif.message}
                        </div>
                    </div>
                ))}

                {/* [NEW] Install PWA Prompt at Global Level */}
                <InstallPWA />

                {/* Glass Header */}
                <header className="sticky top-0 z-30 bg-black/60 border-b border-white/5 px-8 flex items-center h-20 backdrop-blur-xl">
                    <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
                                {menuItems.find(i => isActive(i.path) || (location.pathname === '/admin' && i.path === '/admin'))?.label || 'Visão Geral'}
                            </h2>
                            <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                {restaurant?.name || 'A Carregar...'}
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <button className="relative p-2 text-gray-400 hover:text-[#D4AF37] transition-colors group">
                                <MessageSquare size={22} className="group-hover:scale-110 transition-transform" />
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black animate-pulse"></span>
                            </button>

                            {/* DEMO BUTTON - Visible only for TEST or DEMO restaurants */}
                            {((restaurant?.name || '').toLowerCase().includes('teste') || (restaurant?.name || '').toLowerCase().includes('demo')) && (
                                <button
                                    onClick={async () => {
                                        const { populateMenu } = await import('../utils/populateMenu');
                                        populateMenu(restaurant?.id);
                                    }}
                                    className="bg-blue-600/20 hover:bg-blue-600 outline outline-1 outline-blue-500/50 text-blue-400 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                                    title="Preencher menu com dados de exemplo (Apenas em modo Teste/Demo)"
                                >
                                    ⚡ <span className="hidden sm:inline">Botão Mágico (Demo)</span>
                                </button>
                            )}

                            <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>

                            <div className="flex items-center gap-4 pl-2 cursor-pointer group">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">{user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">Gestor da Loja</p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold shadow-lg group-hover:bg-[#D4AF37] group-hover:text-black transition-all transform group-hover:scale-105">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto pb-24">
                    <Routes>
                        <Route path="/" element={<DashboardStats restaurantId={restaurant?.id} />} />
                        <Route path="/menu" element={<MenuManager categories={categories} restaurantId={restaurant?.id} onUpdate={handleMenuUpdate} />} />
                        <Route path="/orders" element={<KitchenBoard restaurantId={restaurant?.id} config={config} restaurantName={restaurant?.name} />} />
                        <Route path="/clients" element={<ClientManager />} />
                        <Route path="/chat" element={<ChatAdminPanel categories={categories} onUpdate={handleMenuUpdate} restaurantId={restaurant?.id} />} />
                        <Route path="/qrcode" element={<QRCodeGenerator url={`${window.location.origin}/${restaurant?.slug}`} restaurantName={restaurant?.slug} />} />
                        <Route path="/settings" element={
                            <div className="space-y-6">
                                {/* Style Controls with Name Editor */}
                                <StyleControls
                                    config={config}
                                    setConfig={handleConfigChange}
                                    restaurantName={restaurant?.name}
                                    onNameChange={handleNameUpdate}
                                    slug={restaurant?.slug}
                                    onSlugChange={handleSlugUpdate}
                                    onReset={() => { }}
                                    onLogoUpload={handleLogoUpload}
                                />

                                {/* Category Manager Button & Modal */}
                                <div className="p-6 sm:p-8 bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center transition-all hover:shadow-md">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Menu e Categorias</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie pratos, categorias e abas internas do cardápio.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCategoryModal(true)}
                                        className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-xl hover:bg-black dark:hover:bg-white transition-all font-bold flex items-center gap-2 shadow-md hover:-translate-y-0.5"
                                    >
                                        <UtensilsCrossed size={18} />
                                        Gerenciar Menu
                                    </button>
                                </div>

                                {showCategoryModal && (
                                    <CategoryManager
                                        restaurantId={restaurant?.id}
                                        categories={categories}
                                        onUpdate={handleMenuUpdate}
                                        onClose={() => setShowCategoryModal(false)}
                                    />
                                )}
                            </div>
                        } />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

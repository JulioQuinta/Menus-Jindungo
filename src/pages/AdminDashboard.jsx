import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import toast, { Toaster } from 'react-hot-toast';
import { compressImage } from '../lib/imageUtils';
import { QrCode, ClipboardList, TrendingUp, Settings, LogOut, ChevronRight, Menu, Bell, LinkIcon, MapPin, Search, Star, Utensils, MonitorSmartphone, Mail, Smartphone, Eye, Calendar, Tag, Info, UserX, MessageSquare, Volume2, Shield, LayoutDashboard, UtensilsCrossed, User, Award, Ticket, Users, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Components
import DashboardStats from '../components/DashboardStats';
import MenuManager from '../components/MenuManager';
import KitchenBoard from '../components/KitchenBoard';
import CategoryManager from '../components/CategoryManager';
import StyleControls from '../components/StyleControls';
import DeliverySettings from '../components/DeliverySettings';
import CustomerManager from '../components/CustomerManager';
import ChatAdminPanel from '../components/ChatAdminPanel';
import InstallPWA from '../components/InstallPWA';
import StaffManager from '../components/StaffManager';
import QRCodeGenerator from '../components/QRCodeGenerator';
import OrderHistory from '../components/OrderHistory';
import LoyaltyManager from '../components/LoyaltyManager';
import BusinessInfoManager from '../components/BusinessInfoManager';
import ReservationManager from '../components/ReservationManager';
import FeedbackManager from '../components/FeedbackManager';
import CouponManager from '../components/CouponManager';
import UpgradePrompt from '../components/UpgradePrompt';
import { getPlanFeatures } from '../utils/planLimits';

// Refactored Sub-components
import AdminSidebar from '../components/dashboard/AdminSidebar';
import AdminHeader from '../components/dashboard/AdminHeader';
import AdminAlerts from '../components/dashboard/AdminAlerts';
import MasqueradeBanner from '../components/dashboard/MasqueradeBanner';

const AdminDashboard = () => {
    const { user, signOut, loading: authLoading } = useAuth();
    const { logoUrl: globalLogoUrl } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

                    // Browser Notification
                    if (Notification.permission === 'granted') {
                        new Notification("Novo Pedido Jindungo!", {
                            body: `De: ${payload.new.customer_name || 'Cliente'} - ${payload.new.total} Kz`,
                            icon: '/jindungo_logo_v3.png'
                        });
                    }
                }
            )
            .subscribe();

        const reservationsChannel = supabase
            .channel('new-reservations-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurant.id}`
                },
                (payload) => {
                    // Play Sound
                    try {
                        const audio = new Audio('/bell.mp3');
                        audio.play().catch(e => console.log("Audio autoplay blocked", e));
                    } catch (err) {
                        console.log("Audio error", err);
                    }

                    const newResAlert = {
                        id: `res-${payload.new.id}`,
                        isReservation: true,
                        mesa_id: `${payload.new.num_tables} Mesas`,
                        request_type: `Reserva: ${payload.new.customer_name}`,
                        created_at: payload.new.created_at
                    };
                    setActiveAlerts(prev => [...prev, newResAlert]);
                    toast.success(`Nova Reserva de ${payload.new.customer_name}!`, { icon: '📅', duration: 6000 });

                    // Browser Notification
                    if (Notification.permission === 'granted') {
                        new Notification("Nova Reserva Jindungo!", {
                            body: `Cliente: ${payload.new.customer_name} para ${payload.new.num_tables} mesas`,
                            icon: '/jindungo_logo_v3.png'
                        });
                    }
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
            supabase.removeChannel(reservationsChannel);
        };
    }, [restaurant]);

    const handleDismissAlert = async (id) => {
        const alertToDismiss = activeAlerts.find(a => a.id === id);

        // Optimistic Remove
        setActiveAlerts(prev => prev.filter(a => a.id !== id));

        if (alertToDismiss && (alertToDismiss.isOrder || alertToDismiss.isReservation)) {
            if (alertToDismiss.isOrder) navigate('/admin/orders');
            if (alertToDismiss.isReservation) navigate('/admin/reservations');
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
        primaryColor: '#D4AF37',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        layoutMode: 'list',
        darkMode: false,
        whatsappNumber: '',
        logoUrl: ''
    });

    const [businessInfo, setBusinessInfo] = useState(null);

    useEffect(() => {
        if (user) {
            fetchRestaurantData();

            // Request Notification Permission
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
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
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
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

                if (currentRestaurant.business_info) {
                    setBusinessInfo(currentRestaurant.business_info);
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
            try {
                const { error } = await supabase
                    .from('restaurants')
                    .update({ theme_config: updated }) // updated is now guaranteed to be the evaluated object
                    .eq('id', restaurant.id);

                if (error) throw error;
            } catch (err) {
                console.error("Erro ao salvar config:", err);
            }
        }
    };

    const handleBusinessInfoSave = async (newInfo) => {
        setBusinessInfo(newInfo);
        if (restaurant) {
            try {
                const { error } = await supabase
                    .from('restaurants')
                    .update({ business_info: newInfo })
                    .eq('id', restaurant.id);
                if (error) throw error;
                toast.success("Informações do negócio atualizadas!");
            } catch (err) {
                console.error("Erro ao salvar info:", err);
                toast.error("Erro ao salvar as informações.");
            }
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
                toast.error("Este link já está em uso. Por favor, escolha outro.");
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
            toast.success("Link do menu atualizado!");
            return true;
        } catch (error) {
            console.error("Error updating slug:", error);
            toast.error("Erro ao atualizar o link.");
            return false;
        }
    };

    // [NEW] Handle Logo Upload (Supabase Storage)
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !restaurant) return;

        try {
            toast.loading("Otimizando logotipo...", { id: 'logo-upload' });

            // Compress logo to smaller size (maxWidth 400 for logos)
            const uploadFile = await compressImage(file, 400, 0.85);

            const fileExt = uploadFile.name.split('.').pop() || 'png';
            const fileName = `logos/${restaurant.id}/logo_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('menus').upload(fileName, uploadFile, {
                cacheControl: '3600',
                upsert: true
            });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
            if (!publicUrl) throw new Error("Falha ao obter URL pública");

            await handleConfigChange(prev => ({ ...prev, logoUrl: publicUrl }));
            toast.success("Logotipo atualizado com sucesso!", { id: 'logo-upload' });
        } catch (error) {
            console.error('Error saving logo:', error);
            toast.error("Erro ao salvar logotipo.", { id: 'logo-upload' });
        }
    };

    // [NEW] Handle Header Background Upload
    const handleHeaderBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !restaurant) return;

        try {
            toast.loading("Otimizando capa...", { id: 'capa-upload' });

            const uploadFile = await compressImage(file, 1600, 0.75);

            const fileExt = uploadFile.name.split('.').pop() || 'jpg';
            const fileName = `headers/${restaurant.id}/headbg_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('menus').upload(fileName, uploadFile, {
                cacheControl: '3600',
                upsert: true
            });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
            if (!publicUrl) throw new Error("Falha ao obter URL pública");

            await handleConfigChange(prev => ({ ...prev, headerBgUrl: publicUrl }));
            toast.success("Capa atualizada com sucesso!", { id: 'capa-upload' });
        } catch (error) {
            console.error("Error uploading header bg:", error);
            toast.error("Erro ao carregar a imagem de capa.", { id: 'capa-upload' });
        }
    };

    const handleMenuUpdate = () => {
        fetchRestaurantData(); // Refresh data
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Visão Geral', path: '/admin' },
        { icon: MessageSquare, label: 'Assistente IA', path: '/admin/chat' },
        { icon: UtensilsCrossed, label: 'Menu Digital', path: '/admin/menu' },
        { icon: ClipboardList, label: 'Pedidos (Cozinha)', path: '/admin/orders' },
        { icon: Calendar, label: 'Reservas', path: '/admin/reservations' },
        { icon: User, label: 'CRM Clientes', path: '/admin/crm', feature: 'canCollectClientData' },
        { icon: MessageSquare, label: 'Avaliações', path: '/admin/feedbacks', feature: 'canCollectClientData' },
        { icon: Award, label: 'Fidelização', path: '/admin/loyalty', feature: 'canCollectClientData' },
        { icon: Info, label: 'Horários & Info', path: '/admin/info', feature: 'canCollectClientData' },
        { icon: Ticket, label: 'Marketing', path: '/admin/marketing' },
        { icon: Users, label: 'Equipa / Staff', path: '/admin/staff', feature: 'canManageStaff' },
        { icon: QrCode, label: 'QR Code', path: '/admin/qrcode' },
        { icon: Settings, label: 'Configurações', path: '/admin/settings' },
    ];

    const isExpired = restaurant?.valid_until ? new Date(restaurant.valid_until) < new Date() : false;
    const features = getPlanFeatures(restaurant?.plan);

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
        <div className="flex h-screen bg-[#121212] text-gray-100 overflow-hidden max-w-[100vw] font-sans">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px]"></div>
            </div>

            {/* Sidebar Overlay (Mobile only) */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <AdminSidebar 
                isSidebarOpen={isSidebarOpen}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                menuItems={menuItems}
                location={location}
                globalLogoUrl={globalLogoUrl}
                signOut={signOut}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 bg-[#121212]">


                {/* [NEW] Waiter & Order Alerts Section */}
                <AdminAlerts activeAlerts={activeAlerts} onDismiss={handleDismissAlert} />

                {/* [NEW] Masquerade Warning Banner */}
                <MasqueradeBanner restaurantName={restaurant?.name} />

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

                {/* Removed InstallPWA from here since it is now global in App.jsx */}

                {/* Glass Header */}
                <AdminHeader 
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    location={location}
                    menuItems={menuItems}
                    user={user}
                />

                <div className="p-8 max-w-7xl mx-auto pb-24">
                    <Routes>
                        <Route path="/" element={
                            <DashboardStats restaurantId={restaurant?.id} features={features} />
                        } /><Route path="/menu" element={<MenuManager categories={categories} restaurantId={restaurant?.id} onUpdate={handleMenuUpdate} />} />

                        <Route path="/orders" element={
                            features.canUseKDS ? (
                                <KitchenBoard restaurantId={restaurant?.id} config={config} restaurantName={restaurant?.name} />
                            ) : (
                                <OrderHistory restaurantId={restaurant?.id} />
                            )
                        } />

                        <Route path="/staff" element={
                            features.canManageStaff ? (
                                <StaffManager restaurantId={restaurant?.id} />
                            ) : (
                                <UpgradePrompt
                                    title="Gestão de Staff & Garçons"
                                    requiredPlan="Business"
                                    features={[
                                        "Criar sub-contas para a sua equipa",
                                        "Atribuir funções (Cozinha, Receção, etc.)",
                                        "Acesso rápido via PIN para tablets",
                                        "Segurança e controlo de permissões"
                                    ]}
                                />
                            )
                        } />

                        <Route path="/crm" element={
                            features.canCollectClientData ? (
                                <CustomerManager restaurantId={restaurant?.id} />
                            ) : (
                                <UpgradePrompt
                                    title="CRM & Base de Dados de Clientes"
                                    requiredPlan="Corporate"
                                    features={[
                                        "Guardar automaticamente contactos de WhatsApp",
                                        "Ver quem são os seus clientes mais fiéis",
                                        "Exportar lista para campanhas de marketing",
                                        "Análise de Ticket Médio por cliente"
                                    ]}
                                />
                            )
                        } />

                        <Route path="/feedbacks" element={
                            features.canCollectClientData ? (
                                <FeedbackManager restaurantId={restaurant?.id} />
                            ) : (
                                <UpgradePrompt
                                    title="Avaliações e Feedback"
                                    requiredPlan="Corporate"
                                    features={[
                                        "Receber avaliações diretas dos clientes (1 a 5 estrelas)",
                                        "Ver comentários privados sobre o serviço",
                                        "Melhorar a qualidade baseada em opiniões reais"
                                    ]}
                                />
                            )
                        } />

                        <Route path="/loyalty" element={
                            features.canCollectClientData ? (
                                <LoyaltyManager restaurantId={restaurant?.id} />
                            ) : (
                                <UpgradePrompt
                                    title="Hub de Fidelização"
                                    requiredPlan="Corporate"
                                    features={[
                                        "Meta de pedidos personalizada",
                                        "Recompensas automáticas para clientes fiéis",
                                        "Cartão VIP digital no checkout",
                                        "Aumento de taxa de recorrência"
                                    ]}
                                />
                            )
                        } />

                        <Route path="/reservations" element={
                            <ReservationManager restaurantId={restaurant?.id} />
                        } />

                        <Route path="/info" element={
                            features.canCollectClientData ? (
                                <BusinessInfoManager
                                    info={businessInfo}
                                    onSave={handleBusinessInfoSave}
                                    isLoading={loading}
                                />
                            ) : (
                                <UpgradePrompt
                                    title="Horários & Contactos"
                                    requiredPlan="Business"
                                    features={[
                                        "Configuração de horário de funcionamento",
                                        "Controlo automático de loja aberta/fechada",
                                        "Localização com Link Google Maps",
                                        "Redes Sociais prontas no menu"
                                    ]}
                                />
                            )
                        } />

                        <Route path="/marketing" element={
                            features.canUseKDS ? (
                                <CouponManager restaurantId={restaurant?.id} />
                            ) : (
                                <UpgradePrompt
                                    title="Marketing & Cupões"
                                    requiredPlan="Business"
                                    features={[
                                        "Criar códigos de desconto personalizados",
                                        "Limitar uso por data ou quantidade",
                                        "Atrair clientes via Redes Sociais",
                                        "Aumentar faturação em dias calmos"
                                    ]}
                                />
                            )
                        } />

                        <Route path="/chat" element={<ChatAdminPanel categories={categories} onUpdate={handleMenuUpdate} restaurantId={restaurant?.id} />} />
                        <Route path="/qrcode" element={<QRCodeGenerator url={`${window.location.origin}/${restaurant?.slug}`} restaurantName={restaurant?.name || restaurant?.slug} logoUrl={config?.logoUrl} />} />
                        <Route path="/settings" element={
                            <div className="space-y-6">
                                <StyleControls
                                    config={config}
                                    setConfig={handleConfigChange}
                                    restaurantName={restaurant?.name}
                                    onNameChange={handleNameUpdate}
                                    slug={restaurant?.slug}
                                    onSlugChange={handleSlugUpdate}
                                    onReset={() => { }}
                                    onLogoUpload={handleLogoUpload}
                                    onHeaderBgUpload={handleHeaderBgUpload}
                                />

                                <DeliverySettings
                                    restaurantId={restaurant?.id}
                                    initialConfig={restaurant?.delivery_config}
                                    features={features}
                                />

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

                {/* [NEW] Floating Action Button: View Menu */}
                {restaurant?.slug && (
                    <a
                        href={`/${restaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 sm:left-auto sm:right-8 sm:translate-x-0 z-40 bg-white text-black px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/20 hover:scale-105 active:scale-95 hover:bg-[#D4AF37] transition-all flex items-center gap-3 font-bold group"
                    >
                        <Eye size={20} className="group-hover:animate-pulse" />
                        <span className="whitespace-nowrap">Ver Ementa Pública</span>
                        <ExternalLink size={16} className="opacity-50" />
                    </a>
                )}

                <Toaster position="top-right" />
            </main>
        </div>
    );
};

export default AdminDashboard;

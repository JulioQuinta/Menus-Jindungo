import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminAlerts } from '../hooks/useAdminAlerts';
import { useDashboardStats } from '../hooks/useDashboardStats';
import toast, { Toaster } from 'react-hot-toast';
import { QrCode, ClipboardList, TrendingUp, Settings, LogOut, ChevronRight, Menu, Bell, LinkIcon, MapPin, Search, Star, Utensils, MonitorSmartphone, Mail, Smartphone, Eye, Calendar, Tag, Info, UserX, MessageSquare, Volume2, Shield, LayoutDashboard, UtensilsCrossed, User, Award, Ticket, Users, ExternalLink, X, Package } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import { getPlanFeatures } from '../utils/planLimits';
import { Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import DashboardStatsGrid from '../components/dashboard/DashboardStatsGrid';
import QuickActionGrid from '../components/dashboard/QuickActionGrid';
import UpgradePromoSection from '../components/dashboard/UpgradePromoSection';
import DashboardAlertSystem from '../components/dashboard/DashboardAlertSystem';
import ExpirationModal from '../components/dashboard/ExpirationModal';

// Global Audio instance to prevent repeated allocation and browser lag
const notificationSound = new Audio('/bell.mp3');
notificationSound.volume = 0.5;

// Lazy-loaded Components with Retry Logic
const DashboardStats = lazyWithRetry(() => import('../components/DashboardStats'));
const MenuManager = lazyWithRetry(() => import('../components/MenuManager'));
const KitchenBoard = lazyWithRetry(() => import('../components/KitchenBoard'));
const CategoryManager = lazyWithRetry(() => import('../components/CategoryManager'));
const StyleControls = lazyWithRetry(() => import('../components/StyleControls'));
const DeliverySettings = lazyWithRetry(() => import('../components/DeliverySettings'));
const CustomerManager = lazyWithRetry(() => import('../components/CustomerManager'));
const ChatAdminPanel = lazyWithRetry(() => import('../components/ChatAdminPanel'));
const StaffManager = lazyWithRetry(() => import('../components/StaffManager'));
const QRCodeGenerator = lazyWithRetry(() => import('../components/QRCodeGenerator'));
const OrderHistory = lazyWithRetry(() => import('../components/OrderHistory'));
const LoyaltyManager = lazyWithRetry(() => import('../components/LoyaltyManager'));
const BusinessInfoManager = lazyWithRetry(() => import('../components/BusinessInfoManager'));
const ReservationManager = lazyWithRetry(() => import('../components/ReservationManager'));
const FeedbackManager = lazyWithRetry(() => import('../components/FeedbackManager'));
const CouponManager = lazyWithRetry(() => import('../components/CouponManager'));
const UpgradePrompt = lazyWithRetry(() => import('../components/UpgradePrompt'));
const InventoryManager = lazyWithRetry(() => import('../components/InventoryManager'));
const SettingsManager = lazyWithRetry(() => import('../components/SettingsManager'));

// Refactored Sub-components
import AdminSidebar from '../components/dashboard/AdminSidebar';
import AdminHeader from '../components/dashboard/AdminHeader';
import AdminAlerts from '../components/dashboard/AdminAlerts';
import MasqueradeBanner from '../components/dashboard/MasqueradeBanner';
import AdminMobileNav from '../components/dashboard/AdminMobileNav';
import StaffPinModal from '../components/StaffPinModal';
import PaymentSaaSModal from '../components/PaymentSaaSModal';
import CommandPalette from '../components/dashboard/CommandPalette';
import HypnoticStats from '../components/dashboard/HypnoticStats';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary'; // [NEW] QA & Performance

const AdminDashboard = () => {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { logoUrl: globalLogoUrl } = useSettings();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // [NEW] Hooks for Data & Alerts (Performance & Cleanliness)
    const { 
        restaurant, setRestaurant, categories, businessInfo, loading: dataLoading, config, 
        handleConfigChange, handleBusinessInfoSave, handleLogoUpload, handleHeaderBgUpload, fetchRestaurantData 
    } = useAdminData(user);
    const { activeAlerts, handleDismissAlert } = useAdminAlerts(restaurant?.id, navigate);
    const stats = useDashboardStats(restaurant?.id);

    const [activeStaff, setActiveStaff] = useState(null);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [globalNotifications, setGlobalNotifications] = useState([]);
    const [showExpirationModal, setShowExpirationModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [dismissedNotifIds, setDismissedNotifIds] = useState(() => JSON.parse(localStorage.getItem('jindungo_dismissed_notifications') || '[]'));
    const [isExpirationDismissed, setIsExpirationDismissed] = useState(() => localStorage.getItem('jindungo_expiration_dismissed') === 'true');
    const [settingsTab, setSettingsTab] = useState('visual'); // 'visual' | 'delivery'

    // [NEW] Fetch Global Admin Notifications (Filtered by audience)
    useEffect(() => {
        const fetchGlobalNotifications = async () => {
            try {
                // Determine which notifications to show based on user role
                let query = supabase
                    .from('system_notifications')
                    .select('*')
                    .eq('is_active', true);
                
                // If not super_admin, only show 'all' or 'admin' targeted notifications
                if (role !== 'super_admin') {
                    query = query.in('target_role', ['all', 'admin']);
                }

                const { data, error } = await query.order('created_at', { ascending: false });
                
                if (error) throw error;
                // Filter out already dismissed ones
                setGlobalNotifications(data?.filter(n => !dismissedNotifIds.includes(n.id)) || []);
            } catch (err) {
                console.error("Error fetching system notifications:", err);
            }
        };
        if (user) fetchGlobalNotifications();
    }, [role, user, dismissedNotifIds]);

    const handleDismissNotif = (id) => {
        const newDismissed = [...dismissedNotifIds, id];
        setDismissedNotifIds(newDismissed);
        localStorage.setItem('jindungo_dismissed_notifications', JSON.stringify(newDismissed));
    };

    const handleDismissExpiration = () => {
        setIsExpirationDismissed(true);
        localStorage.setItem('jindungo_expiration_dismissed', 'true');
    };

    // [NEW] Staff Session Expiry Check (8 Hours)
    useEffect(() => {
        if (restaurant?.id) {
            const STAFF_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 Hours
            const savedName = localStorage.getItem(`jindungo_staff_name_${restaurant.id}`);
            const savedId = localStorage.getItem(`jindungo_staff_id_${restaurant.id}`);
            const loginTime = localStorage.getItem(`jindungo_staff_login_time_${restaurant.id}`);

            if (savedName && savedId && loginTime) {
                const elapsed = Date.now() - parseInt(loginTime);
                if (elapsed < STAFF_EXPIRY_MS) {
                    setActiveStaff({ id: savedId, name: savedName });
                } else {
                    // Session Expired
                    localStorage.removeItem(`jindungo_staff_id_${restaurant.id}`);
                    localStorage.removeItem(`jindungo_staff_name_${restaurant.id}`);
                    localStorage.removeItem(`jindungo_staff_login_time_${restaurant.id}`);
                    toast.error("Sessão de staff expirada (Turno de 8h). Por favor, entre novamente.");
                    setActiveStaff(null);
                }
            }
        }
    }, [restaurant?.id]);
    
    // [NEW] Show Welcome Modal for First Time Users
    useEffect(() => {
        const welcomed = localStorage.getItem('jindungo_welcome_dismissed');
        if (!welcomed && restaurant) {
            setShowWelcomeModal(true);
            localStorage.setItem('jindungo_welcome_dismissed', 'true');
        }
    }, [restaurant]);

    // [NEW] Command Palette Shortcut (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // [SECURE OUTBOX DISPATCHER] OWASP A01:2021
    useEffect(() => {
        if (!restaurant?.id) return;

        let activeConfig = null;
        let activeChannel = null;

        const setupOutboxDispatcher = async () => {
            const { data: configData } = await supabase
                .from('private_gateway_configs')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .maybeSingle();

            if (!configData || !configData.api_url || !configData.token) return;
            activeConfig = configData;

            await processPendingMessages(activeConfig);

            activeChannel = supabase.channel(`outbox-dispatch-${restaurant.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_outbox_messages',
                    filter: `restaurant_id=eq.${restaurant.id}`
                }, async (payload) => {
                    if (payload.new && payload.new.status === 'pending') {
                        await processPendingMessages(activeConfig);
                    }
                })
                .subscribe();
        };

        const processPendingMessages = async (configData) => {
            const { data: pendingMsgs } = await supabase
                .from('whatsapp_outbox_messages')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            
            if (!pendingMsgs || pendingMsgs.length === 0) return;
            
            const { whatsappService } = await import('../services/whatsappService');
            
            for (const msg of pendingMsgs) {
                try {
                    // Bloqueio otimista para evitar disparos duplicados se houver abas múltiplas abertas
                    const { data: checkData, error: lockErr } = await supabase.from('whatsapp_outbox_messages')
                        .update({ status: 'sent', updated_at: new Date().toISOString() })
                        .eq('id', msg.id)
                        .eq('status', 'pending')
                        .select();
                    
                    if (lockErr || !checkData || checkData.length === 0) {
                        continue; // Já processado ou falha de lock, salta para o próximo
                    }

                    await whatsappService.sendWhatsAppMessage({
                        apiUrl: configData.api_url,
                        token: configData.token,
                        instanceName: configData.instance_name,
                        gatewayType: configData.gateway_type
                    }, msg.phone, msg.message);
                } catch (err) {
                    console.error("Failed to dispatch outbox message:", err);
                    await supabase.from('whatsapp_outbox_messages')
                        .update({ 
                            status: 'failed', 
                            error_message: err.message || 'Erro desconhecido',
                            updated_at: new Date().toISOString() 
                        })
                        .eq('id', msg.id);
                }
            }
        };

        setupOutboxDispatcher();

        return () => {
            if (activeChannel) {
                supabase.removeChannel(activeChannel);
            }
        };
    }, [restaurant?.id]);

    // Explicit logout
    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
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

    const handleMenuUpdate = () => {
        fetchRestaurantData(); // Refresh data
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Visão Geral', path: '/admin' },
        { icon: MessageSquare, label: 'Assistente IA', path: '/admin/chat' },
        { icon: UtensilsCrossed, label: 'Menu Digital', path: '/admin/menu' },
        { icon: ClipboardList, label: 'Pedidos (Cozinha)', path: '/admin/orders' },
        { icon: Package, label: 'Gestão de Stock', path: '/admin/inventory' },
        { icon: Calendar, label: 'Reservas', path: '/admin/reservations' },
        { icon: User, label: 'CRM Clientes', path: '/admin/crm', feature: 'canCollectClientData' },
        { icon: MessageSquare, label: 'Avaliações', path: '/admin/feedbacks', feature: 'canCollectClientData' },
        { icon: Award, label: 'Fidelização', path: '/admin/loyalty', feature: 'canCollectClientData' },
        { icon: Info, label: 'Horários & Info', path: '/admin/info' },
        { icon: Ticket, label: 'Marketing', path: '/admin/marketing' },
        { icon: Users, label: 'Equipa / Staff', path: '/admin/staff', feature: 'canManageStaff' },
        { icon: QrCode, label: 'QR Code', path: '/admin/qrcode' },
        { icon: Settings, label: 'Configurações', path: '/admin/settings' },
    ];

    const isExpired = restaurant?.valid_until ? new Date(restaurant.valid_until) < new Date() : false;
    const daysUntilExpiration = restaurant?.valid_until 
        ? Math.ceil((new Date(restaurant.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) 
        : null;
    const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;
    const features = getPlanFeatures(restaurant?.plan);

    if (dataLoading) return (
        <div className="flex bg-[#121212] flex-col h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mb-4"></div>
            <p className="text-gray-400 font-mono text-sm animate-pulse">Verificando Credenciais Menús Jindungo...</p>
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
                                    <p className="text-sm text-gray-300 font-medium">Faça Transferência via Multicaixa Express ou Depósito Bancário para:</p>
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
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full bg-[#D4AF37] hover:bg-[#AA8B2C] text-black font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Renovação Imediata (MCX Express)</span>
                        </button>
                        <button
                            onClick={handleLogout}
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
        <div className="flex h-screen bg-[#121212] text-gray-100 overflow-hidden max-w-[100vw] font-sans relative">
            {/* Ambient Background Incandescente Dourado Suave */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[10%] w-[70vw] h-[70vh] rounded-full bg-[#F5C542]/15 blur-[200px]"></div>
                <div className="absolute top-[25%] right-[-5%] w-[60vw] h-[60vh] rounded-full bg-[#EAC775]/10 blur-[180px]"></div>
                <div className="absolute bottom-[-10%] left-[15%] w-[65vw] h-[65vh] rounded-full bg-[#D4AF37]/15 blur-[220px]"></div>
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
                restaurantLogoUrl={config?.logoUrl}
                signOut={handleLogout}
                restaurantName={restaurant?.name}
                restaurantSlug={restaurant?.slug}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent">

                <DashboardAlertSystem 
                    activeAlerts={activeAlerts}
                    handleDismissAlert={handleDismissAlert}
                    restaurant={restaurant}
                    globalNotifications={globalNotifications}
                    handleDismissNotif={handleDismissNotif}
                    isExpiringSoon={isExpiringSoon}
                    isExpirationDismissed={isExpirationDismissed}
                    daysUntilExpiration={daysUntilExpiration}
                    setShowExpirationModal={setShowExpirationModal}
                    handleDismissExpiration={handleDismissExpiration}
                />

                <ExpirationModal 
                    isOpen={showExpirationModal}
                    onClose={() => setShowExpirationModal(false)}
                    restaurant={restaurant}
                    daysUntilExpiration={daysUntilExpiration}
                    onShowPayment={() => setShowPaymentModal(true)}
                />

                <StaffPinModal 
                    isOpen={showStaffModal} 
                    onClose={() => setShowStaffModal(false)}
                    restaurantId={restaurant?.id}
                    onLogin={(staff) => setActiveStaff(staff)}
                />

                <PaymentSaaSModal 
                    isOpen={showPaymentModal} 
                    onClose={() => setShowPaymentModal(false)}
                    restaurant={restaurant}
                />

                {/* Glass Header */}
                <AdminHeader 
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    location={location}
                    menuItems={menuItems}
                    user={user}
                    restaurant={restaurant}
                    activeStaff={activeStaff}
                    setShowStaffModal={setShowStaffModal}
                    onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                    businessInfo={businessInfo}
                    onSaveBusinessInfo={handleBusinessInfoSave}
                />

                <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-32 lg:pb-24">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center p-20 opacity-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mb-4"></div>
                            <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">A carregar módulo...</span>
                        </div>
                    }>
                        <ComponentErrorBoundary componentName="Admin Main Area">
                            <Routes>
                                <Route path="/" element={
                                    <div className="animate-fade-in-up">
                                        <DashboardStats restaurantId={restaurant?.id} features={features} />
                                    </div>
                                } />
                                <Route path="/menu" element={<MenuManager categories={categories} restaurantId={restaurant?.id} onUpdate={handleMenuUpdate} />} />

                        <Route path="/orders" element={
                            features.canUseKDS ? (
                                <KitchenBoard restaurantId={restaurant?.id} config={config} restaurantName={restaurant?.name} />
                            ) : (
                                <OrderHistory restaurantId={restaurant?.id} />
                            )
                        } />
                        <Route path="/inventory" element={<InventoryManager restaurantId={restaurant?.id} />} />

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
                            <ReservationManager restaurantId={restaurant?.id} restaurantName={restaurant?.name} />
                        } />

                        <Route path="/info" element={
                            <BusinessInfoManager
                                info={businessInfo}
                                onSave={handleBusinessInfoSave}
                                isLoading={dataLoading}
                                features={features}
                            />
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
                        <Route path="/qrcode" element={<QRCodeGenerator url={`${window.location.origin}/r/${restaurant?.slug}`} restaurantName={restaurant?.name || restaurant?.slug} logoUrl={config?.logoUrl} />} />
                        <Route path="/settings" element={
                            <SettingsManager
                                restaurantId={restaurant?.id}
                                restaurantName={restaurant?.name}
                                slug={restaurant?.slug}
                                config={config}
                                setConfig={handleConfigChange}
                                onNameChange={handleNameUpdate}
                                onSlugChange={handleSlugUpdate}
                                onLogoUpload={handleLogoUpload}
                                onHeaderBgUpload={handleHeaderBgUpload}
                                categories={categories}
                                onCategoryUpdate={handleMenuUpdate}
                            />
                        } />
                            </Routes>
                        </ComponentErrorBoundary>
                    </Suspense>
                </div>

                {/* [NEW] Floating Action Button: View Menu (Hidden on Mobile to use Bottom Nav space) */}
                {restaurant?.slug && (
                    <a
                        href={`/r/${restaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex fixed bottom-8 right-8 z-40 bg-white text-black px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/20 hover:scale-105 active:scale-95 hover:bg-[#D4AF37] transition-all items-center gap-3 font-bold group"
                    >
                        <Eye size={20} className="group-hover:animate-pulse" />
                        <span className="whitespace-nowrap">Ver Menu Digital</span>
                        <ExternalLink size={16} className="opacity-50" />
                    </a>
                )}

                {/* [NEW] Welcome Modal */}
                {showWelcomeModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                        <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>

                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#F1C40F] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl">
                                    <Award size={40} className="text-black" />
                                </div>

                                <h2 className="text-3xl font-serif font-black text-white mb-4">
                                    Bem-vindo à Família Menús Jindungo!
                                </h2>
                                
                                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                    Parabéns! A sua conta foi ativada com sucesso. Já pode começar a configurar o seu menu digital e receber pedidos.
                                </p>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/20">
                                            <Utensils size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Passo 1</p>
                                            <p className="text-sm font-bold text-white">Adicione as suas categorias e pratos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                            <QrCode size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Passo 2</p>
                                            <p className="text-sm font-bold text-white">Imprima o seu QR Code único</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowWelcomeModal(false)}
                                    className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
                                >
                                    Começar Agora
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <AdminMobileNav 
                    onOpenSidebar={() => setIsMobileMenuOpen(true)} 
                    restaurantSlug={restaurant?.slug}
                />

                <CommandPalette 
                    isOpen={isCommandPaletteOpen} 
                    onClose={() => setIsCommandPaletteOpen(false)}
                    menuItems={menuItems}
                />

                <Toaster position="top-right" />
            </main>
        </div>
    );
};

export default AdminDashboard;

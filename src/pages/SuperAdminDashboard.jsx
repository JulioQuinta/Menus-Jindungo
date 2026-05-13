import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { populateDemoData } from '../utils/populateDemoData';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, signOut, loading: authLoading } = useAuth();
    const { logoUrl: globalLogoUrl, updateLogoUrl } = useSettings();
    const [activeTab, setActiveTab] = useState('overview'); // overview, restaurants, users
    const [loading, setLoading] = useState(true);

    // Data
    const [users, setUsers] = useState([]);
    const [restaurants, setRestaurants] = useState([]);

    // Pagination and Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [notifications, setNotifications] = useState([]);
    const [newNotification, setNewNotification] = useState({ message: '', type: 'info' });
    const [isSendingNotification, setIsSendingNotification] = useState(false);

    const [stats, setStats] = useState({
        totalRestaurants: 0,
        activeRestaurants: 0,
        totalItems: 0,
        totalUsers: 0
    });

    const [editingUser, setEditingUser] = useState(null); // For Role Modal

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRest, setNewRest] = useState({ name: '', slug: '', owner_id: '' });
    const [isCreating, setIsCreating] = useState(false);

    // Renew Modal State
    const [renewModal, setRenewModal] = useState({
        isOpen: false,
        restaurant: null,
        selectedPlan: null,
        customDays: 0
    });

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        restaurant: null,
        confirmName: ''
    });

    const PLANS = [
        { id: 'semanal', label: 'Semanal (7 Dias)', days: 7, name: 'Plano Semanal' },
        { id: 'mensal', label: 'Mensal (30 Dias)', days: 30, name: 'Plano Mensal' },
        { id: 'trimestral', label: 'Trimestral (90 Dias)', days: 90, name: 'Plano Trimestral' },
        { id: 'quadrimestral', label: 'Quadrimestral (120 Dias)', days: 120, name: 'Plano Quadrimestral' },
        { id: 'semestral', label: 'Semestral (180 Dias)', days: 180, name: 'Plano Semestral' },
        { id: 'anual', label: 'Anual (365 Dias)', days: 365, name: 'Plano Anual' },
        { id: 'manual', label: 'Ajuste Manual (±)', days: 0, name: 'Ajuste Manual' }
    ];

    // [NEW] Premium Tooltip Component (Simplified & Isolated)
    const Tooltip = ({ text, children }) => {
        if (!text) return children;
        const title = text.includes(':') ? text.split(':')[0] : text;

        return (
            <div className="relative group/tip inline-flex">
                {children}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-md text-white rounded-xl border border-white/10 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 whitespace-nowrap z-[100] shadow-xl pointer-events-none scale-95 group-hover/tip:scale-100 origin-bottom">
                    <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">{title}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-black/90"></div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (userError) throw userError;
            setUsers(userData || []);

            // 2. Fetch Restaurants
            const { data: restData, error: restError } = await supabase
                .from('restaurants')
                .select('*, profiles:owner_id(email)')
                .order('created_at', { ascending: false });
            if (restError) throw restError;
            setRestaurants(restData || []);

            // 3. Fetch Total Items 
            const { count: itemsCount, error: itemsError } = await supabase
                .from('menu_items')
                .select('*', { count: 'exact', head: true });

            // 4. Fetch System Notifications
            const { data: notifData, error: notifError } = await supabase
                .from('system_notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (notifError) console.error("Error fetching notifications:", notifError);
            else setNotifications(notifData || []);

            // Calculate Stats
            setStats({
                totalRestaurants: restData?.length || 0,
                activeRestaurants: restData?.filter(r => r.status === 'active')?.length || 0,
                totalItems: itemsCount || 0,
                totalUsers: userData?.length || 0
            });

        } catch (error) {
            // Ignore AbortError if the component is unmounting or similar
            if (error?.name === 'AbortError' || error?.message?.includes('Abort')) return;

            console.error('FINAL Error fetching data in SuperAdminDashboard:', error);
            if (error && error.message) {
                toast.error(`Erro: ${error.message}`);
            } else {
                toast.error("Erro ao carregar dados do painel.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- SaaS: Create Restaurant ---
    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        if (!newRest.name || !newRest.slug || !newRest.owner_id) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setIsCreating(true);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .insert([
                    {
                        name: newRest.name,
                        slug: newRest.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                        owner_id: newRest.owner_id,
                        status: 'active',
                        plan: 'Free Trial', // Default plan
                        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days free trial
                    }
                ])
                .select('*, profiles:owner_id(email)')
                .single();

            if (error) throw error;

            toast.success("Restaurante (Cliente) criado com sucesso!");
            setRestaurants([data, ...restaurants]);
            setIsAddModalOpen(false);
            setNewRest({ name: '', slug: '', owner_id: '' });

            // Update stats
            setStats(prev => ({
                ...prev,
                totalRestaurants: prev.totalRestaurants + 1,
                activeRestaurants: prev.activeRestaurants + 1
            }));

        } catch (error) {
            console.error("Erro ao criar restaurante:", error);
            if (error.code === '23505') {
                toast.error("Este 'Link Personalizado (Slug)' já está em uso.");
            } else {
                toast.error("Erro ao criar cliente. Verifique as permissões.");
            }
        } finally {
            setIsCreating(false);
        }
    };

    // --- SaaS: Extend Subscription ---
    const handleConfirmRenewal = async () => {
        if (!renewModal.restaurant || !renewModal.selectedPlan || !renewModal.selectedTier) {
            toast.error("Por favor, selecione tanto o Plano (Nível) como o Ciclo de Faturação.");
            return;
        }

        const { id: restId, valid_until: currentValidUntil } = renewModal.restaurant;
        let daysToAdd = renewModal.selectedPlan.days;
        let planName = renewModal.selectedTier.name; // Use the selected tier name (Start, Business, Corporate)

        if (renewModal.selectedPlan.id === 'manual') {
            daysToAdd = parseInt(renewModal.customDays) || 0;
            if (daysToAdd === 0) {
                toast.error("Insira um número válido de dias (ex: -30 ou 15).");
                return;
            }
        }

        try {
            // No ajuste manual, alteramos sempre a partir da data de validade atual para permitir correções precisas
            let baseDate;
            if (renewModal.selectedPlan.id === 'manual') {
                baseDate = currentValidUntil ? new Date(currentValidUntil) : new Date();
            } else {
                // Se for plano novo e já expirado, partimos de 'hoje'. Se ainda não, somamos à data atual dele.
                baseDate = (!currentValidUntil || new Date(currentValidUntil) < new Date())
                    ? new Date()
                    : new Date(currentValidUntil);
            }

            baseDate.setDate(baseDate.getDate() + daysToAdd);
            const newDateStr = baseDate.toISOString();

            const { error } = await supabase
                .from('restaurants')
                .update({ valid_until: newDateStr, plan: planName })
                .eq('id', restId);

            if (error) throw error;

            setRestaurants(restaurants.map(r => r.id === restId ? { ...r, valid_until: newDateStr, plan: planName } : r));
            toast.success(`Plano ${planName} aplicado com sucesso! Validade atualizada.`);
            setRenewModal({ isOpen: false, restaurant: null, selectedPlan: null, selectedTier: null, customDays: 0 });

        } catch (error) {
            console.error("Erro ao renovar:", error);
            toast.error("Erro ao renovar plano. Tente novamente.");
        }
    };

    const handleMasquerade = (restaurantId) => {
        localStorage.setItem('masquerade_restaurant_id', restaurantId);
        window.open('/admin', '_blank'); // Open in new tab so Super Admin keeps their dashboard open
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.restaurant) return;

        if (deleteModal.confirmName !== deleteModal.restaurant.name) {
            toast.error("O nome introduzido não corresponde ao nome do restaurante.");
            return;
        }

        try {
            const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', deleteModal.restaurant.id);

            if (error) throw error;

            setRestaurants(restaurants.filter(r => r.id !== deleteModal.restaurant.id));
            toast.success(`Restaurante "${deleteModal.restaurant.name}" eliminado com sucesso.`);
            setDeleteModal({ isOpen: false, restaurant: null, confirmName: '' });
        } catch (error) {
            console.error("Erro ao eliminar restaurante:", error);
            toast.error("Ocorreu um erro ao eliminar. Certifique-se que tem permissões.");
        }
    };

    // --- SaaS: Populate Demo Data ---
    const handlePopulateDemo = async (restId, restName) => {
        if (!window.confirm(`Deseja carregar o MENU DE TESTE (10 categorias e 25 pratos) para o restaurante "${restName}"?`)) return;
        
        const loadingToast = toast.loading("Gerando menu completo de demonstração...");
        try {
            const result = await populateDemoData(restId);
            if (result.success) {
                toast.success(result.message, { id: loadingToast });
                fetchData();
            } else {
                // Better handling of AbortError or connection issues
                if (result.message?.includes('interrompida') || result.message?.includes('Conexão')) {
                    toast.error(result.message, { id: loadingToast, duration: 6000 });
                } else {
                    toast.error(result.message, { id: loadingToast });
                }
            }
        } catch (error) {
            console.error("Error populating demo:", error);
            toast.error("Ocorreu um erro no preenchimento de teste.", { id: loadingToast });
        }
    };

    // --- User Management ---
    const handleUpdateRole = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setEditingUser(null);
            toast.success(`Role atualizada para ${newRole}!`);
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error("Erro ao atualizar role.");
        }
    };

    const toggleUserProfileBan = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            toast.success(`Usuário ${newStatus === 'banned' ? 'banido' : 'ativado'} com sucesso.`);
        } catch (error) {
            toast.error("Erro ao alterar status.");
        }
    };

    const approveUser = async (userId, userEmail, userPhone, userName) => {
        // Abrir a aba de forma síncrona antes do await para evitar o bloqueio de popups do navegador
        let waWindow = null;
        if (userPhone) {
            waWindow = window.open('about:blank', '_blank');
        }

        try {
            const { error } = await supabase.rpc('approve_client', { client_id: userId });
            
            if (error) {
                if (waWindow) waWindow.close();
                console.error("RPC Error:", error);
                throw error;
            }

            setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
            toast.success("Cliente aprovado com sucesso! Já pode fazer login.");
            
            const firstName = userName ? userName.split(' ')[0] : 'Cliente';
            const message = `Olá ${firstName}! A sua conta Jindungo foi ativada com sucesso. Já pode aceder ao seu Painel de Gestão: https://jindungo.ao/login`;

            if (userPhone && waWindow) {
                const cleanPhone = userPhone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                waWindow.location.href = waUrl;
                toast("WhatsApp aberto numa nova aba.", { icon: '💬' });
            } else if (userEmail) {
                if (waWindow) waWindow.close(); // just in case
                const mailtoUrl = `mailto:${userEmail}?subject=${encodeURIComponent("Conta Ativada - Jindungo")}&body=${encodeURIComponent(message)}`;
                // Create a temporary link to open mailto to avoid popup blockers and empty tabs
                const link = document.createElement('a');
                link.href = mailtoUrl;
                link.click();
                toast("Cliente de Email aberto.", { icon: '📧' });
            }
            
            // Optionally update active restaurant stats
            setStats(prev => ({
                ...prev,
                activeRestaurants: prev.activeRestaurants + 1
            }));

        } catch (error) {
            console.error("ERRO AO APROVAR:", error);
            toast.error(`Erro: ${error.message || error.details || "Desconhecido"}`);
        }
    };

    // --- Restaurant Management ---
    const toggleRestaurantStatus = async (restId, currentStatus) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ status: newStatus })
                .eq('id', restId);
            if (error) throw error;
            setRestaurants(restaurants.map(r => r.id === restId ? { ...r, status: newStatus } : r));

            // Update stats 
            setStats(prev => ({
                ...prev,
                activeRestaurants: newStatus === 'active' ? prev.activeRestaurants + 1 : prev.activeRestaurants - 1
            }));

            toast.success(`Restaurante ${newStatus === 'suspended' ? 'suspenso' : 'reativado'} com sucesso.`);
        } catch (error) {
            toast.error("Erro ao alterar status do restaurante.");
        }
    };

    // --- Notifications Management ---
    const handleCreateNotification = async (e) => {
        e.preventDefault();
        if (!newNotification.message.trim()) return;

        setIsSendingNotification(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('system_notifications')
                .insert([{
                    message: newNotification.message,
                    type: newNotification.type,
                    is_active: true,
                    created_by: user.id
                }])
                .select()
                .single();

            if (error) throw error;

            setNotifications([data, ...notifications]);
            setNewNotification({ message: '', type: 'info' });
            toast.success("Mensagem global ativada com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar mensagem.");
        } finally {
            setIsSendingNotification(false);
        }
    };

    const toggleNotificationState = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('system_notifications')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setNotifications(notifications.map(n => n.id === id ? { ...n, is_active: !currentStatus } : n));
            toast.success(`Mensagem ${!currentStatus ? 'ativada' : 'revogada'} com sucesso.`);
        } catch (error) {
            toast.error("Erro ao alterar estado da mensagem.");
        }
    };

    const deleteNotification = async (id) => {
        try {
            const { error } = await supabase
                .from('system_notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotifications(notifications.filter(n => n.id !== id));
            toast.success("Mensagem eliminada do histórico.");
        } catch (error) {
            toast.error("Erro ao eliminar mensagem.");
        }
    };

    // Helpers
    const isExpired = (dateString) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    // Filter and Pagination Logic
    const getFilteredRestaurants = () => {
        if (!searchQuery) return restaurants;
        const lowerQuery = searchQuery.toLowerCase();
        return restaurants.filter(r =>
            r.name?.toLowerCase().includes(lowerQuery) ||
            r.slug?.toLowerCase().includes(lowerQuery) ||
            r.profiles?.email?.toLowerCase().includes(lowerQuery)
        );
    };

    const getFilteredUsers = () => {
        if (!searchQuery) return users;
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(u =>
            u.email?.toLowerCase().includes(lowerQuery) ||
            u.id?.toLowerCase().includes(lowerQuery)
        );
    };

    const filteredRestaurants = getFilteredRestaurants();
    const paginatedRestaurants = filteredRestaurants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalRestaurantPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

    const filteredUsers = getFilteredUsers();
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Reset page when search or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    // Financial Intelligence Calculations
    // With the new tier system, pricing might be different (e.g. Start=$10, Business=$20, Corporate=$50)
    // For now, I'll map the tiers to some hypothetical monthly MRR to keep the dashboard working.
    const TIER_PRICES = {
        'Start': { price: 15000, mrr: 15000, icon: '🌱' }, // Assuming Monthly Start
        'Business': { price: 30000, mrr: 30000, icon: '🚀' }, // Assuming Monthly Business
        'Corporate': { price: 60000, mrr: 60000, icon: '🏢' }, // Assuming Monthly Corporate
        'Free Trial': { price: 0, mrr: 0, icon: '⏱️' }
    };

    let totalMRR = 0;
    let expiringRevenue7Days = 0;
    let planBreakdown = {};

    restaurants.forEach(rest => {
        if (!rest.valid_until || isExpired(rest.valid_until)) return;

        const tierName = rest.plan || 'Free Trial';
        // Handle legacy plan names gracefully
        const mappedTierName = ['Start', 'Business', 'Corporate', 'Free Trial'].includes(tierName) ? tierName : 'Start';
        const planData = TIER_PRICES[mappedTierName];

        if (planData) {
            totalMRR += planData.mrr;
            planBreakdown[tierName] = (planBreakdown[tierName] || 0) + 1;

            const diffDays = Math.ceil((new Date(rest.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 && diffDays >= 0) {
                // Assume they will renew the same plan
                expiringRevenue7Days += planData.price;
            }
        }
    });

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-[#0A0A0A] p-6 sm:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8 animate-pulse">
                    {/* Header Skeleton */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <div className="space-y-3">
                            <div className="h-8 bg-white/10 rounded w-64"></div>
                            <div className="h-4 bg-white/5 rounded w-48"></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-10 bg-white/10 rounded-xl w-32"></div>
                            <div className="h-10 bg-white/10 rounded-xl w-24"></div>
                        </div>
                    </div>
                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5"></div>
                        ))}
                    </div>
                    {/* Table Skeleton */}
                    <div className="h-[400px] bg-white/5 rounded-2xl border border-white/5"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#0A0A0A] p-6 sm:p-8 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0000] to-transparent opacity-50 pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-serif text-[#D4AF37] font-bold tracking-wide">Centro de Comando</h1>
                        <p className="text-[10px] sm:text-sm text-gray-400 mt-1 uppercase tracking-widest">Jindungo Plataforma Global</p>
                    </div>
                    <div className="flex gap-2 sm:gap-4">
                        {activeTab === 'restaurants' && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="hidden sm:block bg-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-all"
                            >
                                + Novo Cliente
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex-1 sm:flex-none bg-white/10 backdrop-blur-md border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-white/20 transition-all text-white whitespace-nowrap"
                        >
                            Painel Admin
                        </button>
                        <button
                            onClick={async () => {
                                await signOut();
                                navigate('/login', { replace: true });
                            }}
                            className="bg-red-900/30 backdrop-blur-md border border-red-800/50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-red-900/50 hover:border-red-500 transition-all text-red-200"
                        >
                            Sair
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                    <button onClick={() => setActiveTab('restaurants')} className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-white/30 hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg sm:text-xl">🏪</span>
                        </div>
                        <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Clientes</p>
                        <p className="text-2xl sm:text-4xl font-serif text-white font-bold z-10">{stats.totalRestaurants}</p>
                    </button>

                    <button onClick={() => setActiveTab('restaurants')} className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-green-500/30 hover:shadow-[0_10px_30px_rgba(34,197,94,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg sm:text-xl">✅</span>
                        </div>
                        <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Ativos</p>
                        <p className="text-2xl sm:text-4xl font-serif text-green-400 font-bold z-10">{stats.activeRestaurants}</p>
                    </button>

                    <button onClick={() => setActiveTab('users')} className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-blue-500/30 hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg sm:text-xl">👥</span>
                        </div>
                        <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Acessos</p>
                        <p className="text-2xl sm:text-4xl font-serif text-blue-400 font-bold z-10">{stats.totalUsers}</p>
                    </button>

                    <button onClick={() => setActiveTab('overview')} className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-[#D4AF37]/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/10 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg sm:text-xl">🍽️</span>
                        </div>
                        <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Items</p>
                        <p className="text-2xl sm:text-4xl font-serif text-[#D4AF37] font-bold z-10">{stats.totalItems}</p>
                    </button>
                </div>

                {/* Desktop SaaS Tabs (Hidden on very small mobile if using Bottom Nav) */}
                <div className="hidden sm:flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl w-full max-w-4xl mx-auto overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'overview', label: 'Painel', icon: '📊' },
                        { id: 'restaurants', label: 'Clientes', icon: '🏪' },
                        { id: 'users', label: 'Acessos', icon: '🔒' },
                        { id: 'finance', label: 'Faturação', icon: '💳' },
                        { id: 'notifications', label: 'Altifalante', icon: '📢' },
                        { id: 'settings', label: 'Plataforma', icon: '⚙️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-gradient-to-b from-white/10 to-white/5 text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-black/20 rounded-3xl shadow-2xl border border-white/10 overflow-hidden min-h-[500px] backdrop-blur-sm">

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="p-8 animate-fade-in">
                            <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/5 pb-4">Definições da App & Logótipo</h2>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-[#D4AF37]">Logótipo Principal</h3>
                                    <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#D4AF37]/20">Proporções Blindadas via CSS</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-6 max-w-2xl">
                                    Substitua a imagem global usada na Landing Page, Marketplace, Login e Admin. A imagem será perfeitamente adaptada sem esticar, mantendo o aspeto premium através de limitações de tamanho CSS predefinidas.
                                </p>

                                <div className="flex flex-col sm:flex-row items-start gap-8">
                                    <div className="w-40 h-40 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden p-6 shadow-inner relative group">
                                        <img src={globalLogoUrl} alt="Logo Atual" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <label className="bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] text-black px-8 py-4 rounded-xl font-bold text-sm cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.2)] text-center flex items-center justify-center gap-2">
                                            <span>Carregar Imagem (Época Festiva)</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    const loadingToast = toast.loading('A propagar logótipo pelo sistema...');
                                                    try {
                                                        const fileExt = file.name.split('.').pop();
                                                        const fileName = `global_logo_${Date.now()}.${fileExt}`;

                                                        const { error: uploadError } = await supabase.storage
                                                            .from('logos')
                                                            .upload(fileName, file);

                                                        if (uploadError) throw uploadError;

                                                        const { data: { publicUrl } } = supabase.storage
                                                            .from('logos')
                                                            .getPublicUrl(fileName);

                                                        const res = await updateLogoUrl(publicUrl);
                                                        if (res?.error) throw res.error;

                                                        toast.success('Logótipo atualizado instantaneamente!', { id: loadingToast });
                                                    } catch (err) {
                                                        console.error('Error in logo update:', err);
                                                        toast.error(err.message || 'Ocorreu um erro na atualização.', { id: loadingToast });
                                                    }
                                                }}
                                            />
                                        </label>
                                        <button
                                            onClick={async () => {
                                                const loadingToast = toast.loading('A restaurar...');
                                                try {
                                                    const res = await updateLogoUrl('/jindungo_logo_v3.png');
                                                    if (res?.error) throw res.error;
                                                    toast.success('Logótipo Base restaurado.', { id: loadingToast });
                                                } catch (err) {
                                                    console.error('Error restoring logo:', err);
                                                    toast.error('Falhou a restaurar.', { id: loadingToast });
                                                }
                                            }}
                                            className="text-gray-400 hover:text-white text-sm underline transition-colors w-fit"
                                        >
                                            Restaurar Padrão
                                        </button>
                                        <div className="text-xs text-gray-500 max-w-md mt-2">Formatos Otimizados: PNG, WEBP (Fundo Transparente).</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RESTAURANTS TAB */}
                    {activeTab === 'restaurants' && (
                        <div>
                            {/* Search Bar */}
                            <div className="p-4 bg-black/40 border-b border-white/5">
                                <div className="relative max-w-md">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por nome, link ou email do cliente..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/5">
                                        <thead className="bg-black/40">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Restaurante / Link</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Responsável</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Faturação (Validade)</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Sistema</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Acões SaaS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent">
                                            {paginatedRestaurants.map(rest => {
                                                const expired = isExpired(rest.valid_until);
                                                return (
                                                    <tr key={rest.id} className="hover:bg-white/5 transition duration-300 group">
                                                        <td className="px-6 py-5 whitespace-nowrap">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-serif font-bold group-hover:scale-110 transition-transform shadow-[0_4px_10px_rgba(212,175,55,0.2)]">
                                                                    {rest.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">{rest.name}</div>
                                                                    <div className="text-xs text-gray-500 mt-1 hover:text-white transition-colors">
                                                                        <a href={`/${rest.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                                                            <span className="text-gray-600">jindungo.ao/</span>{rest.slug}
                                                                            <span className="text-[10px]">🔗</span>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-white">{rest.profiles?.email || 'Nenhum'}</div>
                                                            <div className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full inline-block mt-1 font-mono">
                                                                ID: {rest.owner_id?.substring(0, 8) || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                                            <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${rest.plan === 'Plano Semanal' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30' :
                                                                rest.plan === 'Plano Anual' ? 'bg-purple-900/20 text-purple-400 border-purple-800/50' :
                                                                    'bg-white/5 text-gray-300 border-white/10'
                                                                }`}>
                                                                {rest.plan || 'Free'}
                                                            </span>
                                                            <div className={`mt-2 text-xs font-medium ${expired ? 'text-red-400' : 'text-green-500'}`}>
                                                                {expired ? 'Expirou: ' : 'Vence: '} {formatDate(rest.valid_until)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                                            <Tooltip text="Visibilidade do Menu">
                                                                <button
                                                                    onClick={() => toggleRestaurantStatus(rest.id, rest.status)}
                                                                    className={`px-3 py-1 inline-flex items-center gap-2 text-xs font-bold rounded-lg border transition-all ${rest.status === 'active'
                                                                        ? 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-red-900/20 hover:border-red-900/50 hover:text-red-400'
                                                                        : 'bg-red-900/20 text-red-500 border-red-900/50 hover:bg-green-900/20 hover:border-green-900/50 hover:text-green-400'
                                                                        }`}
                                                                >
                                                                    <span className={`w-2 h-2 rounded-full ${rest.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></span>
                                                                    {rest.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                                                </button>
                                                            </Tooltip>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex gap-2 justify-end">
                                                                <Tooltip text="Faturação e Plano">
                                                                    <button onClick={() => setRenewModal({ isOpen: true, restaurant: rest, selectedPlan: PLANS[1], customDays: 0 })} className="w-8 h-8 rounded-lg bg-green-900/20 text-green-400 border border-green-900/50 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-110">💳</button>
                                                                </Tooltip>
                                                                <Tooltip text="Gerar Dados Demo">
                                                                    <button onClick={() => handlePopulateDemo(rest.id, rest.name)} className="w-8 h-8 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-900/50 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-110">🪄</button>
                                                                </Tooltip>
                                                                <Tooltip text="Entrar como Dono">
                                                                    <button onClick={() => handleMasquerade(rest.id)} className="w-8 h-8 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black flex items-center justify-center transition-all shadow-sm hover:scale-110">🕵️‍♂️</button>
                                                                </Tooltip>
                                                                <Tooltip text="Eliminar Restaurante">
                                                                    <button onClick={() => setDeleteModal({ isOpen: true, restaurant: rest, confirmName: '' })} className="w-8 h-8 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-110">🗑️</button>
                                                                </Tooltip>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-white/5">
                                    {paginatedRestaurants.map(rest => {
                                        const expired = isExpired(rest.valid_until);
                                        return (
                                            <div key={rest.id} className="p-4 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-lg">
                                                            {rest.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{rest.name}</div>
                                                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                <span className="text-gray-600">jindungo.ao/</span>{rest.slug}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleRestaurantStatus(rest.id, rest.status)}
                                                        className={`px-2 py-1 flex items-center gap-1.5 text-[10px] font-black rounded-lg border uppercase tracking-widest ${rest.status === 'active' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-500 border-red-900/50'}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${rest.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></span>
                                                        {rest.status === 'active' ? 'ON' : 'OFF'}
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center text-[11px] bg-white/5 rounded-xl p-3 border border-white/5">
                                                    <div className="space-y-1">
                                                        <div className="text-gray-500 font-bold uppercase tracking-tighter text-[9px]">Responsável</div>
                                                        <div className="text-gray-300 font-medium truncate max-w-[140px]">{rest.profiles?.email || 'N/A'}</div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <div className="text-gray-500 font-bold uppercase tracking-tighter text-[9px]">Plano / Expiração</div>
                                                        <div className={`font-bold ${expired ? 'text-red-400' : 'text-[#D4AF37]'}`}>
                                                            {rest.plan || 'Free'} • {formatDate(rest.valid_until)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2">
                                                    <button onClick={() => setRenewModal({ isOpen: true, restaurant: rest, selectedPlan: PLANS[1], customDays: 0 })} className="py-2.5 rounded-xl bg-green-900/20 text-green-400 border border-green-900/50 flex flex-col items-center justify-center gap-1 transition-all text-[9px] font-bold"><span>💳</span><span>RENOVAR</span></button>
                                                    <button onClick={() => handlePopulateDemo(rest.id, rest.name)} className="py-2.5 rounded-xl bg-blue-900/20 text-blue-400 border border-blue-900/50 flex flex-col items-center justify-center gap-1 transition-all text-[9px] font-bold"><span>🪄</span><span>DEMO</span></button>
                                                    <button onClick={() => handleMasquerade(rest.id)} className="py-2.5 rounded-xl bg-white/5 text-white border border-white/10 flex flex-col items-center justify-center gap-1 transition-all text-[9px] font-bold"><span>🕵️‍♂️</span><span>ENTRAR</span></button>
                                                    <button onClick={() => setDeleteModal({ isOpen: true, restaurant: rest, confirmName: '' })} className="py-2.5 rounded-xl bg-red-900/20 text-red-400 border border-red-900/50 flex flex-col items-center justify-center gap-1 transition-all text-[9px] font-bold"><span>🗑️</span><span>APAGAR</span></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* No Results Messages */}
                                {restaurants.length === 0 && (
                                    <div className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum cliente/restaurante registado na plataforma SaaS.</div>
                                )}
                                {restaurants.length > 0 && paginatedRestaurants.length === 0 && (
                                    <div className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum resultado encontrado para "{searchQuery}".</div>
                                )}

                                {/* Pagination Controls */}
                                {totalRestaurantPages > 1 && (
                                    <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 bg-black/20">
                                        <div className="hidden sm:block">
                                            A mostrar <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredRestaurants.length)}</span> de <span className="font-bold text-white">{filteredRestaurants.length}</span>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end items-center">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition border border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Anterior
                                            </button>
                                            <div className="px-3 text-white font-bold">
                                                {currentPage} / {totalRestaurantPages}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalRestaurantPages, p + 1))}
                                                disabled={currentPage === totalRestaurantPages}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition border border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Próximo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div>
                            {/* Search Bar */}
                            <div className="p-4 bg-black/40 border-b border-white/5">
                                <div className="relative max-w-md">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar utilizador por email ou ID..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-black/20 backdrop-blur-sm">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/5">
                                        <thead className="bg-black/40">
                                            <tr>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente / Contacto</th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Nível de Acesso (Role)</th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Status / Bloqueio</th>
                                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Controlos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent">
                                            {paginatedUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-white/5 transition duration-300 group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                                                                {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">{user.full_name || 'Sem Nome'}</div>
                                                                <div className="text-[10px] text-gray-400 mt-0.5">{user.email}</div>
                                                                <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{user.phone || 'Sem Telf'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`px-3 py-1 inline-flex text-[11px] leading-5 font-bold rounded-lg border uppercase tracking-wider ${user.role === 'super_admin' ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' :
                                                            user.role === 'admin' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                                                'bg-white/5 text-gray-400 border-white/10'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`px-3 py-1 inline-flex items-center gap-2 text-xs leading-5 font-bold rounded-lg border ${
                                                            user.status === 'banned' ? 'bg-red-900/20 text-red-500 border-red-900/50' : 
                                                            user.status === 'pending' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50 animate-pulse' :
                                                            'bg-green-900/20 text-green-400 border-green-900/50'
                                                            }`}>
                                                            <span className={`w-2 h-2 rounded-full ${
                                                                user.status === 'banned' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 
                                                                user.status === 'pending' ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]' :
                                                                'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
                                                                }`}></span>
                                                            {user.status === 'banned' ? 'Banned' : user.status === 'pending' ? 'Pendente' : 'Ativo'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            {user.status === 'pending' && (
                                                                <Tooltip text="Aprovar Registo">
                                                                    <button
                                                                        onClick={() => approveUser(user.id, user.email)}
                                                                        className="px-4 py-1.5 rounded-lg bg-orange-600 text-white border border-orange-500 hover:bg-orange-500 font-bold text-xs transition-all shadow-sm hover:scale-105 animate-pulse hover:animate-none"
                                                                    >
                                                                        ✅ Aprovar Cliente
                                                                    </button>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip text="Nível de Acesso">
                                                                <button
                                                                    onClick={() => setEditingUser(user)}
                                                                    className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black font-bold text-xs transition-all shadow-sm hover:scale-105"
                                                                >
                                                                    Permissões
                                                                </button>
                                                            </Tooltip>
                                                            {user.status !== 'pending' && (
                                                                <Tooltip text="Banir / Ativar">
                                                                    <button
                                                                        onClick={() => toggleUserProfileBan(user.id, user.status)}
                                                                        className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all shadow-sm hover:scale-105 ${user.status === 'banned'
                                                                            ? 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-500 hover:text-white'
                                                                            : 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-500 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {user.status === 'banned' ? 'Desbloquear' : 'Banir'}
                                                                    </button>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-white/5">
                                    {paginatedUsers.map((user) => (
                                        <div key={user.id} className="p-4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 border border-white/10 font-bold">
                                                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="text-sm font-bold text-white truncate max-w-[180px]">{user.full_name || 'Sem Nome'}</div>
                                                        <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{user.email}</div>
                                                        <div className="text-[10px] text-gray-500 font-mono">{user.phone || 'Sem Telf'}</div>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`px-1.5 py-0.5 text-[9px] font-black rounded border uppercase tracking-widest ${user.role === 'super_admin' ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' : 'bg-blue-900/20 text-blue-400 border-blue-900/50'}`}>
                                                                {user.role}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 text-[9px] font-black rounded border uppercase tracking-widest ${
                                                                user.status === 'banned' ? 'bg-red-900/20 text-red-400 border-red-900/50' : 
                                                                user.status === 'pending' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50 animate-pulse' :
                                                                'bg-green-900/20 text-green-400 border-green-900/50'
                                                                }`}>
                                                                {user.status === 'banned' ? 'BAN' : user.status === 'pending' ? 'PENDENTE' : 'OK'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {user.status === 'pending' ? (
                                                    <button 
                                                        onClick={() => approveUser(user.id, user.email, user.phone, user.full_name)} 
                                                        className="col-span-2 py-2.5 rounded-xl bg-orange-600 text-white border border-orange-500 font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_15px_rgba(234,88,12,0.4)] animate-pulse"
                                                    >
                                                        ✅ Aprovar Cliente
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => setEditingUser(user)} 
                                                            className="py-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                                                        >
                                                            Permissões
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleUserProfileBan(user.id, user.status)} 
                                                            className={`py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm ${user.status === 'banned' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}
                                                        >
                                                            {user.status === 'banned' ? 'Ativar' : 'Banir'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* No Results */}
                                {users.length === 0 && (
                                    <div className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum utilizador encontrado.</div>
                                )}
                                {users.length > 0 && paginatedUsers.length === 0 && (
                                    <div className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum resultado encontrado para "{searchQuery}".</div>
                                )}

                                {/* Pagination Controls */}
                                {totalUserPages > 1 && (
                                    <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 bg-black/20">
                                        <div className="hidden sm:block">
                                            A mostrar <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-bold text-white">{filteredUsers.length}</span>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end items-center">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition border border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Anterior
                                            </button>
                                            <div className="px-3 text-white font-bold">
                                                {currentPage} / {totalUserPages}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalUserPages, p + 1))}
                                                disabled={currentPage === totalUserPages}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition border border-white/10 text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Próximo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[400px]">
                            {/* Alertas de Subscrição */}
                            <div className="bg-gradient-to-br from-black/80 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-[#D4AF37]/40 transition-all duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
                                <h3 className="text-xl font-serif font-bold text-[#D4AF37] mb-6 flex items-center gap-3 relative z-10">
                                    <span className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-xl">⚠️</span>
                                    Alertas de Subscrição
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    {restaurants
                                        .filter(rest => {
                                            if (!rest.valid_until) return false;
                                            const validUntil = new Date(rest.valid_until);
                                            const today = new Date();
                                            const diffDays = Math.ceil((validUntil - today) / (1000 * 60 * 60 * 24));
                                            return diffDays <= 7 && diffDays >= -30; // Expirando nos prox 7 dias, ou expirados há menos de 30 dias
                                        })
                                        .sort((a, b) => new Date(a.valid_until) - new Date(b.valid_until))
                                        .slice(0, 5) // Mostra max 5
                                        .map(rest => {
                                            const validUntil = new Date(rest.valid_until);
                                            const diffDays = Math.ceil((validUntil - new Date()) / (1000 * 60 * 60 * 24));
                                            const isExpired = diffDays < 0;

                                            return (
                                                <div key={rest.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{rest.name}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{rest.profiles?.email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${isExpired ? 'bg-red-900/50 text-red-400' : 'bg-orange-900/50 text-orange-400'}`}>
                                                            {isExpired ? `Expirou há ${Math.abs(diffDays)} dias` : `Expira em ${diffDays} dias`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {restaurants.filter(r => {
                                        if (!r.valid_until) return false;
                                        const d = Math.ceil((new Date(r.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
                                        return d <= 7 && d >= -30;
                                    }).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                Nenhuma subscrição a expirar brevemente.
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Últimos Clientes Registados */}
                            <div className="bg-gradient-to-br from-black/80 to-white/5 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-white/20 transition-all duration-500">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none group-hover:bg-white/10 transition-all duration-700"></div>
                                <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">🆕</span>
                                    Novos Clientes
                                </h3>

                                <div className="space-y-4 relative z-10">
                                    {restaurants
                                        .slice(0, 3) // Assume que já vêm ordenados por data
                                        .map(rest => (
                                            <div key={rest.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-center">
                                                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg border border-white/10 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xl">
                                                    {rest.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-white text-sm">{rest.name}</p>
                                                    <p className="text-xs text-[#D4AF37] mt-1">{rest.plan || 'Free'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded-md border border-white/5">
                                                        {formatDate(rest.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                    {restaurants.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            Ainda não há clientes registados.
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setActiveTab('restaurants')}
                                    className="w-full mt-6 py-3 bg-white/5 text-gray-300 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
                                >
                                    Ver Todos os Clientes →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FINANCE TAB */}
                    {activeTab === 'finance' && (
                        <div className="p-4 md:p-8 space-y-6 min-h-[400px]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* MRR Card */}
                                <div className="bg-gradient-to-br from-black/80 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-[#D4AF37]/40 transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all"></div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37]">📊</div>
                                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Receita Mensal (MRR)</h3>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl md:text-5xl font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors">{formatCurrency(totalMRR)}</span>
                                                <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">/mês</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] md:text-sm text-gray-500 mt-4 pt-3 border-t border-white/5">
                                            Valor estimado baseado nos planos ativos.
                                        </p>
                                    </div>
                                </div>

                                {/* Receivables Card */}
                                <div className="bg-gradient-to-br from-black/80 to-green-900/10 border border-green-900/30 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-green-500/30 transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none group-hover:bg-green-500/20 transition-all"></div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">💰</div>
                                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Próximos 7 Dias</h3>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl md:text-5xl font-serif font-bold text-green-400">{formatCurrency(expiringRevenue7Days)}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] md:text-sm text-gray-500 mt-4 pt-3 border-t border-white/5">
                                            Previsão de renovações imediatas.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                                <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">🥧</span>
                                    Distribuição de Níveis (Tiers)
                                </h3>

                                {Object.keys(planBreakdown).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(planBreakdown).sort((a, b) => b[1] - a[1]).map(([planName, count]) => {
                                            const mappedPlan = ['Start', 'Business', 'Corporate', 'Free Trial'].includes(planName) ? planName : 'Start';
                                            return (
                                                <div key={planName} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{TIER_PRICES[mappedPlan]?.icon || '📋'}</span>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{planName}</p>
                                                            <p className="text-xs text-gray-400 mt-1">{formatCurrency(TIER_PRICES[mappedPlan]?.price || 0)} estimativa</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xl font-bold text-[#D4AF37]">{count}</span>
                                                        <span className="block text-[10px] text-gray-500 uppercase">Clientes</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-white/5 rounded-xl bg-white/5">
                                        <span className="text-4xl mb-3 block">📉</span>
                                        <p className="text-gray-400 font-medium">Nenhum restaurante ativo no momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="p-4 md:p-8 space-y-6 min-h-[400px]">
                            <div className="bg-gradient-to-br from-[#0a0a0a] to-[#141414] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none"></div>
                                <div className="mb-6 relative z-10">
                                    <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                                        <span className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl md:text-2xl border border-blue-500/20">📢</span>
                                        Notificação Global
                                    </h2>
                                    <p className="text-xs md:text-sm text-gray-400">Avisos e novidades para todos os clientes.</p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleCreateNotification} className="space-y-4 relative z-10 bg-black/40 p-4 md:p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Título (Opcional)</label>
                                            <input
                                                type="text"
                                                value={newNotification.title || ''}
                                                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                                placeholder="Assunto da notícia..."
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tipo de Aviso</label>
                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                {['info', 'warning', 'danger', 'success'].map(type => (
                                                    <label key={type} className="flex-shrink-0 cursor-pointer group">
                                                        <input type="radio" value={type} checked={newNotification.type === type} onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })} className="hidden" />
                                                        <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${newNotification.type === type ? 
                                                            (type === 'info' ? 'bg-blue-500 text-white border-blue-500' : 
                                                             type === 'warning' ? 'bg-orange-500 text-white border-orange-500' :
                                                             type === 'danger' ? 'bg-red-500 text-white border-red-500' :
                                                             'bg-green-500 text-white border-green-500') : 
                                                            'bg-white/5 text-gray-400 border-white/10 group-hover:bg-white/10'}`}>
                                                            {type === 'info' ? 'ℹ️' : type === 'warning' ? '⚠️' : type === 'danger' ? '🚨' : '✅'}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Mensagem</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                                            placeholder="Detalhes da notificação..."
                                            value={newNotification.message}
                                            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                        ></textarea>
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSendingNotification || (!newNotification.message && !newNotification.message?.trim())}
                                        className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#b5952f] disabled:opacity-50 transition-all shadow-[0_4px_15px_rgba(212,175,55,0.3)] active:scale-95"
                                    >
                                        {isSendingNotification ? 'A Publicar...' : 'Emitir Notificação Global'}
                                    </button>
                                </form>
                            </div>

                            {/* Notifications History */}
                            <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                                <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
                                    <span className="text-lg">📜</span>
                                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Histórico de Mensagens</h4>
                                </div>
                                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto scrollbar-hide">
                                    {notifications.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 font-medium">
                                            <span className="text-3xl block mb-2 opacity-30">📭</span>
                                            Nenhum aviso transmitido.
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className={`p-4 flex flex-col gap-3 transition-colors ${notif.is_active ? 'bg-transparent' : 'bg-black/20 opacity-60'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${notif.type === 'info' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                                            notif.type === 'warning' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' :
                                                                notif.type === 'danger' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                                                    'bg-green-900/20 text-green-400 border-green-900/50'
                                                            }`}>
                                                            {notif.type}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase">{formatDate(notif.created_at)}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => toggleNotificationState(notif.id, notif.is_active)} className={`p-1.5 rounded-lg border transition-all ${notif.is_active ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                                                            {notif.is_active ? '🛑' : '✅'}
                                                        </button>
                                                        <button onClick={() => deleteNotification(notif.id)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/10">🗑️</button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-300 leading-relaxed">{notif.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SAAS: Add Restaurant Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-md px-4">
                    <div className="glass-dark border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-serif font-bold text-[#D4AF37]">Novo Cliente</h3>
                            <p className="text-sm text-gray-400 mt-1">Registrar um novo restaurante na plataforma</p>
                        </div>

                        <form onSubmit={handleCreateRestaurant} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Restaurante</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                                    placeholder="Ex: Pastelaria Ouro"
                                    value={newRest.name}
                                    onChange={(e) => setNewRest({ ...newRest, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">URL Personalizado / Slug</label>
                                <div className="flex bg-black/50 rounded-xl overflow-hidden border border-white/10 focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all">
                                    <span className="flex items-center px-4 bg-white/5 text-gray-500 font-mono text-sm border-r border-white/10">/</span>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-transparent px-4 py-3 text-white focus:outline-none"
                                        placeholder="pastelaria-ouro"
                                        value={newRest.slug}
                                        onChange={(e) => setNewRest({ ...newRest, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Isto será o link final: jindungo.ao/<b>{newRest.slug || 'slug'}</b></p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Selecione a Conta do Dono</label>
                                <select
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-all appearance-none"
                                    value={newRest.owner_id}
                                    onChange={(e) => setNewRest({ ...newRest, owner_id: e.target.value })}
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23D4AF37\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                                >
                                    <option value="" disabled className="text-gray-500">Escolha um utilizador existente...</option>
                                    {users.filter(u => u.role === 'admin' || u.role === 'super_admin').map(u => (
                                        <option key={u.id} value={u.id} className="bg-[#121212]">{u.email} ({u.role})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-[#D4AF37]/80 mt-2">Apenas utilizadores com nível Admin/SuperAdmin são listados.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors font-medium text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 px-4 py-3 bg-[#D4AF37] text-black rounded-xl font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:bg-[#b5952f] hover:scale-[1.02] active:scale-95 transition-all text-sm disabled:opacity-50"
                                >
                                    {isCreating ? 'Criando...' : 'Criar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-md px-4">
                    <div className="glass-dark border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                        <div className="text-center mb-8 border-b border-white/10 pb-6">
                            <h3 className="text-2xl font-serif font-bold text-white">Nível de Acesso</h3>
                            <p className="mt-2 text-sm text-[#D4AF37] font-mono">{editingUser.email}</p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, 'super_admin')}
                                className={`w-full py-4 px-5 rounded-2xl border text-sm font-bold transition-all text-left flex items-center justify-between group overflow-hidden relative ${editingUser.role === 'super_admin' ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                            >
                                <div className="relative z-10">
                                    <span className="block text-lg">Super Admin</span>
                                    <span className="block text-xs font-normal opacity-70 mt-1">Acesso Mestre. Cria restaurantes e faz gestão.</span>
                                </div>
                                {editingUser.role === 'super_admin' && <span className="text-2xl relative z-10">👑</span>}
                            </button>
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, 'admin')}
                                className={`w-full py-4 px-5 rounded-2xl border text-sm font-bold transition-all text-left flex items-center justify-between group overflow-hidden relative ${editingUser.role === 'admin' ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-black/40 border-white/10 text-gray-400 hover:border-[#D4AF37]/50 hover:text-white'}`}
                            >
                                <div className="relative z-10">
                                    <span className="block text-lg">Administrador (Dono)</span>
                                    <span className="block text-xs font-normal opacity-70 mt-1">Dono de um restaurante. Gere a ementa própria.</span>
                                </div>
                                {editingUser.role === 'admin' && <span className="text-2xl relative z-10">🍽️</span>}
                            </button>
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, 'client')}
                                className={`w-full py-4 px-5 rounded-2xl border text-sm font-bold transition-all text-left flex items-center justify-between group overflow-hidden relative ${editingUser.role === 'client' ? 'bg-white/10 border-white text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                            >
                                <div className="relative z-10">
                                    <span className="block text-lg">Cliente Publico</span>
                                    <span className="block text-xs font-normal opacity-70 mt-1">Utilizador normal, pode no máximo encomendar.</span>
                                </div>
                                {editingUser.role === 'client' && <span className="text-2xl relative z-10">📱</span>}
                            </button>
                        </div>
                        <div className="mt-8">
                            <button onClick={() => setEditingUser(null)} className="w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors text-sm font-bold tracking-wide uppercase">Cancelar / Voltar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Renew Modal */}
            {renewModal.isOpen && renewModal.restaurant && (
                <div className="fixed inset-0 bg-black/80 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-md px-4">
                    <div className="glass-dark border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all scale-100">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/50">
                                <span className="text-2xl">⏳</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-white">Renovar Subscrição</h3>
                            <p className="text-sm text-[#D4AF37] font-bold mt-1">{renewModal.restaurant.name}</p>
                        </div>

                        <div className="space-y-6 mb-8">
                            {/* 1. Seleção do Nível (Tier) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">1. Selecione o Nível (SaaS Tier):</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'start', name: 'Start' },
                                        { id: 'business', name: 'Business' },
                                        { id: 'corporate', name: 'Corporate' }
                                    ].map(tier => (
                                        <button
                                            key={tier.id}
                                            onClick={() => setRenewModal({ ...renewModal, selectedTier: tier })}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all text-center ${renewModal.selectedTier?.id === tier.id
                                                ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {tier.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Seleção do Ciclo de Faturação */}
                            <div className="pt-4 border-t border-white/5">
                                <label className="block text-sm font-medium text-gray-400 mb-2">2. Selecione o Ciclo de Faturação / Dias:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PLANS.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setRenewModal({ ...renewModal, selectedPlan: plan })}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all text-center ${plan.id === 'manual' ? 'col-span-2' : ''} ${renewModal.selectedPlan?.id === plan.id
                                                ? 'bg-white/20 text-white border-white/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {plan.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {renewModal.selectedPlan?.id === 'manual' && (
                                <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Dias a Adicionar / Remover</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] text-center"
                                        placeholder="Ex: -30 para retirar um mês"
                                        value={renewModal.customDays || ''}
                                        onChange={(e) => setRenewModal({ ...renewModal, customDays: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">Use números negativos (-) para retirar dias caso se tenha enganado.</p>
                                </div>
                            )}

                            {/* Calculation preview */}
                            <div className="bg-black/50 border border-white/5 rounded-xl p-4 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Situação Atual:</span>
                                    <span className={`text-xs font-bold ${isExpired(renewModal.restaurant.valid_until) ? 'text-red-400' : 'text-green-400'}`}>
                                        {isExpired(renewModal.restaurant.valid_until) ? 'Expirado' : 'Ativo'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Nova Validade:</span>
                                    <span className={`text-sm font-bold ${renewModal.selectedPlan?.id === 'manual' && renewModal.customDays < 0 ? 'text-orange-400' : 'text-[#D4AF37]'}`}>
                                        {(() => {
                                            let baseDate;
                                            if (renewModal.selectedPlan?.id === 'manual') {
                                                baseDate = renewModal.restaurant.valid_until ? new Date(renewModal.restaurant.valid_until) : new Date();
                                                const adjustDays = parseInt(renewModal.customDays) || 0;
                                                baseDate.setDate(baseDate.getDate() + adjustDays);
                                            } else {
                                                baseDate = (!renewModal.restaurant.valid_until || isExpired(renewModal.restaurant.valid_until))
                                                    ? new Date()
                                                    : new Date(renewModal.restaurant.valid_until);
                                                baseDate.setDate(baseDate.getDate() + (renewModal.selectedPlan?.days || 0));
                                            }
                                            return formatDate(baseDate.toISOString());
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRenewModal({ isOpen: false, restaurant: null, selectedPlan: null, customDays: 0 })}
                                className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors text-sm font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmRenewal}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors text-sm font-bold shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass-dark border border-red-500/30 p-8 rounded-3xl shadow-[0_10px_50px_rgba(220,38,38,0.2)] max-w-md w-full relative overflow-hidden transform transition-all scale-100">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>

                        <div className="text-center mb-6 relative z-10">
                            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                                <span className="text-2xl">🗑️</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-red-500">Eliminação Crítica</h3>
                        </div>

                        <p className="text-gray-400 mb-6 text-sm text-center relative z-10">
                            Atenção! Esta ação é <strong className="text-white">IRREVERSÍVEL</strong>. O restaurante <span className="text-[#D4AF37] font-bold">"{deleteModal.restaurant?.name}"</span> será completamente apagado, incluindo todo o cardápio e configurações.
                        </p>

                        <div className="space-y-4 relative z-10">
                            <div className="bg-black/60 border border-white/10 rounded-2xl p-5">
                                <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                                    Para confirmar, digite o nome exato: <br />
                                    <strong className="text-white bg-white/5 px-3 py-1.5 rounded-lg inline-block mt-3 select-all border border-white/10">{deleteModal.restaurant?.name}</strong>
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-center mt-2 font-bold"
                                    placeholder="Nome do restaurante..."
                                    value={deleteModal.confirmName}
                                    onChange={(e) => setDeleteModal({ ...deleteModal, confirmName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8 relative z-10">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, restaurant: null, confirmName: '' })}
                                className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors text-sm font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteModal.confirmName !== deleteModal.restaurant?.name}
                                className={`flex-1 py-3 rounded-xl transition-all shadow-lg text-sm font-bold text-white
                                    ${deleteModal.confirmName === deleteModal.restaurant?.name
                                        ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                                        : 'bg-red-900/30 border border-red-900/50 text-red-500/50 cursor-not-allowed'
                                    }`}
                            >
                                Confirmar Eliminação
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Fixed Bottom Navigation (Mobile Only) */}
            <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-[60]">
                <div className="bg-black/80 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 flex items-center justify-around shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
                    {[
                        { id: 'overview', label: 'Resumo', icon: '📊' },
                        { id: 'restaurants', label: 'Clientes', icon: '🏪' },
                        { id: 'users', label: 'Acessos', icon: '🔒' },
                        { id: 'finance', label: 'Guito', icon: '💳' },
                        { id: 'notifications', label: 'Avisos', icon: '📢' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-[#D4AF37]/10 text-[#D4AF37] scale-110 shadow-inner'
                                : 'text-gray-500'
                                }`}
                        >
                            <span className="text-xl leading-none">{tab.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Floating Action Button (FAB) - Mobile Only when in Restaurants tab */}
            {activeTab === 'restaurants' && (
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="sm:hidden fixed bottom-28 right-6 w-14 h-14 bg-[#D4AF37] text-black rounded-full shadow-[0_8px_30px_rgba(212,175,55,0.4)] flex items-center justify-center text-3xl font-bold z-[60] active:scale-90 transition-transform"
                >
                    +
                </button>
            )}
        </div>
    );
};

export default SuperAdminDashboard;

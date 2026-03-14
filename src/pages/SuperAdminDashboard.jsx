import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { populateDemoData } from '../utils/populateDemoData';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
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
        if (!renewModal.restaurant || !renewModal.selectedPlan) return;

        const { id: restId, valid_until: currentValidUntil } = renewModal.restaurant;
        let daysToAdd = renewModal.selectedPlan.days;
        let planName = renewModal.selectedPlan.name;

        if (renewModal.selectedPlan.id === 'manual') {
            daysToAdd = parseInt(renewModal.customDays) || 0;
            if (daysToAdd === 0) {
                toast.error("Insira um número válido de dias (ex: -30 ou 15).");
                return;
            }
            planName = 'Ajuste Manual';
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
            toast.success(`${planName} aplicado com sucesso! Validade atualizada.`);
            setRenewModal({ isOpen: false, restaurant: null, selectedPlan: null, customDays: 0 });

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
        if (!window.confirm(`ATENÇÃO: Deseja preencher o restaurante "${restName}" com 10 categorias e dezenas de pratos de demonstração? Isso foi feito para ajudar novos clientes a entenderem a plataforma.`)) return;

        const loadingToast = toast.loading("A gerar pratos de demonstração, por favor aguarde...");

        try {
            const result = await populateDemoData(restId);
            if (result.success) {
                toast.success(result.message, { id: loadingToast });
            } else {
                toast.error(result.message, { id: loadingToast });
            }
        } catch (error) {
            console.error(error);
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
        if (!window.confirm(`Tem certeza que deseja ${newStatus === 'banned' ? 'BANIR' : 'ATIVAR'} este usuário?`)) return;
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

    // --- Restaurant Management ---
    const toggleRestaurantStatus = async (restId, currentStatus) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        if (!window.confirm(`Tem certeza que deseja ${newStatus === 'suspended' ? 'SUSPENDER' : 'REATIVAR'} este restaurante? O menu público ${newStatus === 'suspended' ? 'ficará offline' : 'voltará ao ar'}.`)) return;

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
        if (!window.confirm("Deseja eliminar este aviso definitivamente do histórico?")) return;
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
    const PLAN_PRICES = {
        'Plano Semanal': { price: 5000, mrr: 21428, icon: '📅' },
        'Plano Mensal': { price: 15000, mrr: 15000, icon: '🌙' },
        'Plano Trimestral': { price: 40000, mrr: 13333, icon: '🍂' },
        'Plano Quadrimestral': { price: 50000, mrr: 12500, icon: '❄️' },
        'Plano Semestral': { price: 70000, mrr: 11666, icon: '☀️' },
        'Plano Anual': { price: 120000, mrr: 10000, icon: '🌍' }
    };

    let totalMRR = 0;
    let expiringRevenue7Days = 0;
    let planBreakdown = {};

    restaurants.forEach(rest => {
        if (!rest.valid_until || isExpired(rest.valid_until)) return;

        const planName = rest.plan;
        const planData = PLAN_PRICES[planName];

        if (planData) {
            totalMRR += planData.mrr;
            planBreakdown[planName] = (planBreakdown[planName] || 0) + 1;

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
                        <h1 className="text-4xl font-serif text-[#D4AF37] font-bold tracking-wide">Centro de Comando SaaS</h1>
                        <p className="text-gray-400 text-sm mt-2 uppercase tracking-widest">Jindungo Plataforma Global</p>
                    </div>
                    <div className="flex gap-4">
                        {activeTab === 'restaurants' && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-[#D4AF37] text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:scale-105 transition-all"
                            >
                                + Novo Cliente
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/20 transition-all text-white"
                        >
                            Menu Pessoal
                        </button>
                        <button
                            onClick={async () => {
                                await signOut();
                                navigate('/login');
                            }}
                            className="bg-red-900/30 backdrop-blur-md border border-red-800/50 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-900/50 hover:border-red-500 transition-all text-red-200"
                        >
                            Sair
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <button onClick={() => setActiveTab('restaurants')} className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-white/30 hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-xl">🏪</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Restaurantes</p>
                        <p className="text-4xl font-serif text-white font-bold z-10">{stats.totalRestaurants}</p>
                    </button>

                    <button onClick={() => setActiveTab('restaurants')} className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-green-500/30 hover:shadow-[0_10px_30px_rgba(34,197,94,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-xl">✅</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Ativos</p>
                        <p className="text-4xl font-serif text-green-400 font-bold z-10">{stats.activeRestaurants}</p>
                    </button>

                    <button onClick={() => setActiveTab('users')} className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-blue-500/30 hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-xl">👥</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Utilizadores</p>
                        <p className="text-4xl font-serif text-blue-400 font-bold z-10">{stats.totalUsers}</p>
                    </button>

                    <button onClick={() => setActiveTab('overview')} className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer w-full hover:-translate-y-1 transition-all duration-300 focus:outline-none hover:border-[#D4AF37]/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/10 to-transparent pointer-events-none transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-xl">🍽️</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 z-10">Itens no Sistema</p>
                        <p className="text-4xl font-serif text-[#D4AF37] font-bold z-10">{stats.totalItems}</p>
                    </button>
                </div>

                {/* Modern Saas Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl w-full max-w-4xl mx-auto overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'overview', label: 'Painel Central', icon: '📊' },
                        { id: 'restaurants', label: 'Clientes', icon: '🏪' },
                        { id: 'users', label: 'Acessos', icon: '🔒' },
                        { id: 'finance', label: 'Faturação', icon: '💳' },
                        { id: 'notifications', label: 'Altifalante', icon: '📢' }
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
                            <div className="overflow-x-auto">
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
                                                        <button
                                                            onClick={() => toggleRestaurantStatus(rest.id, rest.status)}
                                                            className={`px-3 py-1 inline-flex items-center gap-2 text-xs font-bold rounded-lg border transition-all ${rest.status === 'active'
                                                                ? 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-red-900/20 hover:border-red-900/50 hover:text-red-400'
                                                                : 'bg-red-900/20 text-red-500 border-red-900/50 hover:bg-green-900/20 hover:border-green-900/50 hover:text-green-400'
                                                                }`}
                                                            title="Clique para alternar On/Off"
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${rest.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></span>
                                                            {rest.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex gap-2 justify-end transition-opacity duration-300">
                                                            <button
                                                                onClick={() => setRenewModal({ isOpen: true, restaurant: rest, selectedPlan: PLANS[1], customDays: 0 })}
                                                                className="w-8 h-8 rounded-lg bg-green-900/20 text-green-400 border border-green-900/50 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:scale-110"
                                                                title="Renovar Plano"
                                                            >
                                                                💳
                                                            </button>
                                                            <button
                                                                onClick={() => handlePopulateDemo(rest.id, rest.name)}
                                                                className="w-8 h-8 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-900/50 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:scale-110"
                                                                title="Preencher Dados Demo"
                                                            >
                                                                🪄
                                                            </button>
                                                            <button
                                                                onClick={() => handleMasquerade(rest.id)}
                                                                className="w-8 h-8 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:scale-110"
                                                                title="Aceder como Cliente (Entrar)"
                                                            >
                                                                🕵️‍♂️
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({ isOpen: true, restaurant: rest, confirmName: '' })}
                                                                className="w-8 h-8 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:scale-110"
                                                                title="Eliminar Cliente"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {restaurants.length === 0 && (
                                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">Nenhum cliente/restaurante registado na plataforma SaaS.</td></tr>
                                        )}
                                        {restaurants.length > 0 && paginatedRestaurants.length === 0 && (
                                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum resultado encontrado para "{searchQuery}".</td></tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                {totalRestaurantPages > 1 && (
                                    <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-400 bg-black/20">
                                        <div>
                                            A mostrar <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredRestaurants.length)}</span> de <span className="font-bold text-white">{filteredRestaurants.length}</span> resultados
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
                                            >
                                                Anterior
                                            </button>
                                            <div className="flex px-2 items-center text-white font-medium">
                                                {currentPage} / {totalRestaurantPages}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalRestaurantPages, p + 1))}
                                                disabled={currentPage === totalRestaurantPages}
                                                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
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
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/5">
                                    <thead className="bg-black/40">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
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
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                                                            {user.email?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="text-sm font-medium text-white group-hover:text-[#D4AF37] transition-colors">{user.email}</div>
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
                                                    <span className={`px-3 py-1 inline-flex items-center gap-2 text-xs leading-5 font-bold rounded-lg border ${user.status === 'banned' ? 'bg-red-900/20 text-red-500 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'
                                                        }`}>
                                                        <span className={`w-2 h-2 rounded-full ${user.status === 'banned' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`}></span>
                                                        {user.status === 'banned' ? 'Banned' : 'Ativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <button
                                                            onClick={() => setEditingUser(user)}
                                                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black font-bold text-xs transition-all shadow-sm hover:scale-105"
                                                        >
                                                            Permissões
                                                        </button>
                                                        <button
                                                            onClick={() => toggleUserProfileBan(user.id, user.status)}
                                                            className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all shadow-sm hover:scale-105 ${user.status === 'banned'
                                                                ? 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-500 hover:text-white'
                                                                : 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-500 hover:text-white'
                                                                }`}
                                                        >
                                                            {user.status === 'banned' ? 'Desbloquear' : 'Banir'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum utilizador encontrado.</td></tr>
                                        )}
                                        {users.length > 0 && paginatedUsers.length === 0 && (
                                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium border-t border-white/5">Nenhum resultado encontrado para "{searchQuery}".</td></tr>
                                        )}
                                    </tbody>
                                </table>
                                {/* Pagination Controls */}
                                {totalUserPages > 1 && (
                                    <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-400 bg-black/20">
                                        <div>
                                            A mostrar <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-bold text-white">{filteredUsers.length}</span> resultados
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
                                            >
                                                Anterior
                                            </button>
                                            <div className="flex px-2 items-center text-white font-medium">
                                                {currentPage} / {totalUserPages}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalUserPages, p + 1))}
                                                disabled={currentPage === totalUserPages}
                                                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
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
                        <div className="p-6 md:p-8 space-y-8 min-h-[400px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* MRR Card */}
                                <div className="bg-gradient-to-br from-black/80 to-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-[#D4AF37]/40 transition-all duration-500">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37]">📊</div>
                                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm">Receita Mensal (MRR)</h3>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors">{formatCurrency(totalMRR)}</span>
                                                <span className="text-gray-500 font-bold uppercase text-xs tracking-wider">/mês</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-6 pt-4 border-t border-white/5">
                                            Valor estimado de faturação mensal baseado nos planos ativos.
                                        </p>
                                    </div>
                                </div>

                                {/* Receivables Card */}
                                <div className="bg-gradient-to-br from-black/80 to-green-900/10 border border-green-900/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-green-500/30 transition-all duration-500">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none group-hover:bg-green-500/20 transition-all duration-700"></div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">💰</div>
                                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm">Recebíveis (7 Dias)</h3>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-serif font-bold text-green-400">{formatCurrency(expiringRevenue7Days)}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-6 pt-4 border-t border-white/5">
                                            Valor potencial das subscrições que expiram na próxima semana.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
                                <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">🥧</span>
                                    Distribuição de Planos Ativos
                                </h3>

                                {Object.keys(planBreakdown).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(planBreakdown).sort((a, b) => b[1] - a[1]).map(([planName, count]) => (
                                            <div key={planName} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{PLAN_PRICES[planName]?.icon || '📋'}</span>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{planName}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{formatCurrency(PLAN_PRICES[planName]?.price || 0)} /ciclo</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-bold text-[#D4AF37]">{count}</span>
                                                    <span className="block text-[10px] text-gray-500 uppercase">Clientes</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border border-white/5 rounded-xl bg-white/5">
                                        <span className="text-4xl mb-3 block">📉</span>
                                        <p className="text-gray-400 font-medium">Nenhum plano pago ativo no momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="p-6 md:p-8 space-y-8 min-h-[400px]">
                            <div className="bg-gradient-to-br from-[#0a0a0a] to-[#141414] rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] -mr-40 -mt-40 pointer-events-none"></div>
                                <div className="mb-8 relative z-10">
                                    <h2 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                                        <span className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl border border-blue-500/20">📢</span>
                                        Altifalante do Sistema
                                    </h2>
                                    <p className="text-gray-400">Envie notificações globais para todos os clientes logados no painel. Use para avisos de manutenção, novidades ou informações urgentes.</p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleCreateNotification} className="space-y-6 relative z-10 bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Título / Assunto (opcional)</label>
                                        <input
                                            type="text"
                                            value={newNotification.title || ''}
                                            onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                            placeholder="Ex: Atualização Importante do Sistema"
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Mensagem</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                                            placeholder="Escreva os detalhes da notificação aqui..."
                                            value={newNotification.message}
                                            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
                                        <div className="flex flex-wrap gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input type="radio" value="info" checked={newNotification.type === 'info'} onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })} className="accent-[#D4AF37]" />
                                                <span className="text-blue-400 font-bold bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-900/50">ℹ️ Informação</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input type="radio" value="warning" checked={newNotification.type === 'warning'} onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })} className="accent-[#D4AF37]" />
                                                <span className="text-orange-400 font-bold bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-900/50">⚠️ Aviso</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input type="radio" value="danger" checked={newNotification.type === 'danger'} onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })} className="accent-[#D4AF37]" />
                                                <span className="text-red-400 font-bold bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-900/50">🚨 Urgente</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                <input type="radio" value="success" checked={newNotification.type === 'success'} onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })} className="accent-[#D4AF37]" />
                                                <span className="text-green-400 font-bold bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-900/50">✅ Sucesso</span>
                                            </label>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSendingNotification || (!newNotification.message && !newNotification.message?.trim())}
                                            className="px-8 py-3 bg-[#D4AF37] text-black font-bold text-sm rounded-xl hover:bg-[#b5952f] disabled:opacity-50 transition-all shadow-[0_4px_15px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.6)] transform hover:-translate-y-1"
                                        >
                                            {isSendingNotification ? 'A Distribuir...' : 'Publicar Avisos'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Notifications History */}
                            <div className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-black/80 to-transparent">
                                    <h4 className="font-serif font-bold text-white flex items-center gap-2">
                                        <span>📜</span> Histórico de Mensagens Recentes
                                    </h4>
                                </div>
                                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto scrollbar-hide">
                                    {notifications.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 font-medium">
                                            <span className="text-4xl block mb-4 opacity-50">📭</span>
                                            Nenhum aviso transmitido ainda.
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className={`p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors group ${notif.is_active ? 'bg-transparent hover:bg-white/5' : 'bg-black/40 opacity-70'}`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${notif.type === 'info' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                                            notif.type === 'warning' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' :
                                                                notif.type === 'danger' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                                                                    'bg-green-900/20 text-green-400 border-green-900/50'
                                                            }`}>
                                                            {notif.type}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-medium">{formatDate(notif.created_at)}</span>
                                                        {notif.is_active && (
                                                            <span className="flex h-2.5 w-2.5 relative ml-1">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-300">{notif.message}</p>
                                                </div>
                                                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                                    <button
                                                        onClick={() => toggleNotificationState(notif.id, notif.is_active)}
                                                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${notif.is_active
                                                            ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-500 hover:text-white'
                                                            : 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-500 hover:text-white'
                                                            }`}
                                                    >
                                                        {notif.is_active ? 'Revogar' : 'Reativar'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNotification(notif.id)}
                                                        className="px-4 py-2 text-xs text-gray-400 bg-white/5 hover:bg-white/20 hover:text-white border border-white/10 rounded-xl transition-all"
                                                        title="Apagar do histórico"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
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

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Selecione o Ciclo de Faturação:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PLANS.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setRenewModal({ ...renewModal, selectedPlan: plan })}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all text-center ${plan.id === 'manual' ? 'col-span-2' : ''} ${renewModal.selectedPlan?.id === plan.id
                                                ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {plan.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {renewModal.selectedPlan?.id === 'manual' && (
                                <div className="mt-4 bg-black/50 border border-white/10 rounded-xl p-4">
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
        </div>
    );
};

export default SuperAdminDashboard;

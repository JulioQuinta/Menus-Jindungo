import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { populateDemoData } from '../utils/populateDemoData';
import { 
  LayoutDashboard, Users, ShieldAlert, CreditCard, 
  Megaphone, Sliders, Plus, LogOut, Search, 
  CheckCircle, XCircle, Trash2, ShieldCheck, Zap,
  ChevronLeft, ChevronRight, RefreshCw, Key, Globe, Eye,
  FileText, Settings2
} from 'lucide-react';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, signOut, loading: authLoading } = useAuth();
    const { logoUrl: globalLogoUrl, updateLogoUrl } = useSettings();
    const [activeTab, setActiveTab] = useState('restaurants'); // overview, restaurants, users, finance, notifications, settings
    const [loading, setLoading] = useState(true);

    // Data
    const [usersList, setUsersList] = useState([]);
    const [restaurants, setRestaurants] = useState([]);

    // Pagination and Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [notifications, setNotifications] = useState([]);
    const [newNotification, setNewNotification] = useState({ message: '', title: '', type: 'info' });
    const [isSendingNotification, setIsSendingNotification] = useState(false);

    const [stats, setStats] = useState({
        totalRestaurants: 0,
        activeRestaurants: 0,
        totalItems: 0,
        totalUsers: 0
    });

    const [editingUser, setEditingUser] = useState(null); // For Role Modal
    const [invoiceConfigModal, setInvoiceConfigModal] = useState({ isOpen: false, restaurant: null });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRest, setNewRest] = useState({ name: '', slug: '', owner_id: '' });
    const [isCreating, setIsCreating] = useState(false);

    // Renew Modal State
    const [renewModal, setRenewModal] = useState({
        isOpen: false,
        restaurant: null,
        selectedPlan: null,
        selectedTier: null,
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
            setUsersList(userData || []);

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
            if (error?.name === 'AbortError' || error?.message?.includes('Abort')) return;
            console.error('Error fetching data in SuperAdminDashboard:', error);
            toast.error("Erro ao carregar dados do centro de comando.");
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
                        plan: 'Start', // Default plan
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

    // --- SaaS: Invoice and Layout Configuration ---
    const [localInvoiceConfig, setLocalInvoiceConfig] = useState({
        nif: '',
        address: '',
        certification_number: 'FE/305/AGT/2026',
        software_version: 'v3.1',
        layout_color: '#D4AF37',
        show_logo: true,
        invoice_footer_note: '',
        vat_rate: 14,
        exemption_code: '',
        exemption_reason: ''
    });

    useEffect(() => {
        if (invoiceConfigModal.restaurant) {
            const config = invoiceConfigModal.restaurant.invoice_config || {};
            setLocalInvoiceConfig({
                nif: config.nif || '',
                address: config.address || '',
                certification_number: config.certification_number || 'FE/305/AGT/2026',
                software_version: config.software_version || 'v3.1',
                layout_color: config.layout_color || '#D4AF37',
                show_logo: config.show_logo !== false,
                invoice_footer_note: config.invoice_footer_note || '',
                vat_rate: typeof config.vat_rate === 'number' ? config.vat_rate : 14,
                exemption_code: config.exemption_code || '',
                exemption_reason: config.exemption_reason || ''
            });
        }
    }, [invoiceConfigModal.restaurant]);

    const handleSaveInvoiceConfig = async () => {
        if (!invoiceConfigModal.restaurant?.id) return;
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ invoice_config: localInvoiceConfig })
                .eq('id', invoiceConfigModal.restaurant.id);

            if (error) throw error;
            toast.success("Configuração de Fatura guardada!");
            setInvoiceConfigModal({ isOpen: false, restaurant: null });
            fetchData();
        } catch (err) {
            console.error("Error saving invoice config:", err);
            toast.error("Erro ao guardar dados fiscais.");
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
        let planName = renewModal.selectedTier.name;

        if (renewModal.selectedPlan.id === 'manual') {
            daysToAdd = parseInt(renewModal.customDays) || 0;
            if (daysToAdd === 0) {
                toast.error("Insira um número válido de dias (ex: -30 ou 15).");
                return;
            }
        }

        try {
            let baseDate;
            if (renewModal.selectedPlan.id === 'manual') {
                baseDate = currentValidUntil ? new Date(currentValidUntil) : new Date();
            } else {
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
        window.open('/admin', '_blank');
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
                toast.error(result.message, { id: loadingToast, duration: 6000 });
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
            setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setEditingUser(null);
            toast.success(`Nível de acesso atualizado para ${newRole}!`);
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error("Erro ao atualizar nível de acesso.");
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
            setUsersList(usersList.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            toast.success(`Utilizador ${newStatus === 'banned' ? 'banido' : 'ativado'} com sucesso.`);
        } catch (error) {
            toast.error("Erro ao alterar status.");
        }
    };

    const approveUser = async (userId, userEmail, userPhone, userName) => {
        let waWindow = null;
        if (userPhone) {
            waWindow = window.open('about:blank', '_blank');
        }

        try {
            const { error } = await supabase.rpc('approve_client', { client_id: userId });
            if (error) {
                if (waWindow) waWindow.close();
                throw error;
            }

            setUsersList(usersList.map(u => u.id === userId ? { ...u, status: 'active' } : u));
            toast.success("Cliente aprovado com sucesso! Já pode fazer login.");
            
            const firstName = userName ? userName.split(' ')[0] : 'Cliente';
            const message = `Olá ${firstName}! A sua conta Jindungo foi ativada com sucesso. Já pode aceder ao seu Painel de Gestão: https://jindungo.ao/login`;

            if (userPhone && waWindow) {
                const cleanPhone = userPhone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                waWindow.location.href = waUrl;
                toast("WhatsApp aberto numa nova aba.", { icon: '💬' });
            } else if (userEmail) {
                if (waWindow) waWindow.close();
                const mailtoUrl = `mailto:${userEmail}?subject=${encodeURIComponent("Conta Ativada - Jindungo")}&body=${encodeURIComponent(message)}`;
                const link = document.createElement('a');
                link.href = mailtoUrl;
                link.click();
                toast("Cliente de Email aberto.", { icon: '📧' });
            }
        } catch (error) {
            console.error("ERRO AO APROVAR:", error);
            toast.error(`Erro: ${error.message || "Desconhecido"}`);
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
                    title: newNotification.title || '',
                    type: newNotification.type,
                    is_active: true,
                    created_by: user.id
                }])
                .select()
                .single();

            if (error) throw error;

            setNotifications([data, ...notifications]);
            setNewNotification({ message: '', title: '', type: 'info' });
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

    // Filter and Pagination Logic (High Performance with useMemo)
    const filteredRestaurants = useMemo(() => {
        if (!searchQuery) return restaurants;
        const lowerQuery = searchQuery.toLowerCase();
        return restaurants.filter(r =>
            r.name?.toLowerCase().includes(lowerQuery) ||
            r.slug?.toLowerCase().includes(lowerQuery) ||
            r.profiles?.email?.toLowerCase().includes(lowerQuery) ||
            r.id?.includes(searchQuery)
        );
    }, [restaurants, searchQuery]);

    const paginatedRestaurants = useMemo(() => {
        return filteredRestaurants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredRestaurants, currentPage]);

    const totalRestaurantPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return usersList;
        const lowerQuery = searchQuery.toLowerCase();
        return usersList.filter(u =>
            u.email?.toLowerCase().includes(lowerQuery) ||
            u.id?.toLowerCase().includes(lowerQuery) ||
            u.full_name?.toLowerCase().includes(lowerQuery)
        );
    }, [usersList, searchQuery]);

    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredUsers, currentPage]);

    const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    // Financial Intelligence Calculations
    const TIER_PRICES = {
        'Start': { price: 15000, mrr: 15000, icon: '🌱' },
        'Business': { price: 30000, mrr: 30000, icon: '🚀' },
        'Corporate': { price: 60000, mrr: 60000, icon: '🏢' },
        'Free Trial': { price: 0, mrr: 0, icon: '⏱️' }
    };

    let totalMRR = 0;
    let expiringRevenue7Days = 0;
    let planBreakdown = {};

    restaurants.forEach(rest => {
        if (!rest.valid_until || isExpired(rest.valid_until)) return;

        const tierName = rest.plan || 'Free Trial';
        const mappedTierName = ['Start', 'Business', 'Corporate', 'Free Trial'].includes(tierName) ? tierName : 'Start';
        const planData = TIER_PRICES[mappedTierName];

        if (planData) {
            totalMRR += planData.mrr;
            planBreakdown[tierName] = (planBreakdown[tierName] || 0) + 1;

            const diffDays = Math.ceil((new Date(rest.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 && diffDays >= 0) {
                expiringRevenue7Days += planData.price;
            }
        }
    });

    const NAV_TABS = [
        { id: 'overview', label: 'Painel', icon: LayoutDashboard, subtitle: 'Resumo e Alertas' },
        { id: 'restaurants', label: 'Clientes', icon: Users, subtitle: 'Gestão SaaS' },
        { id: 'users', label: 'Acessos', icon: ShieldAlert, subtitle: 'Segurança & Permissões' },
        { id: 'finance', label: 'Faturação', icon: CreditCard, subtitle: 'Receita & MRR' },
        { id: 'notifications', label: 'Altifalante', icon: Megaphone, subtitle: 'Avisos Globais' },
        { id: 'settings', label: 'Plataforma', icon: Sliders, subtitle: 'Logótipo & Definições' },
    ];

    if (loading) {
        return (
            <div className="flex h-screen bg-[#0B0A0A] items-center justify-center text-white">
                <div className="flex items-center gap-3 bg-[#141212] px-8 py-5 rounded-2xl border border-zinc-800 shadow-2xl animate-pulse">
                    <RefreshCw className="animate-spin text-[#E2B755]" size={24} />
                    <span className="font-bold tracking-wider">Carregando Centro de Comando Jindungo Global...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0B0A0A] text-gray-100 font-sans overflow-hidden">
            
            {/* SIDEBAR COMPONENT (Desktop) */}
            <aside className="w-64 bg-[#141212] border-r border-zinc-800/80 hidden md:flex flex-col justify-between p-5 shrink-0 z-20 shadow-2xl">
                <div>
                    <div className="mb-8 px-2 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold tracking-wide text-[#E2B755] font-serif">Centro de Comando</h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase mt-0.5">Jindungo Global</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">v3.1</span>
                    </div>

                    <nav className="space-y-1.5">
                        {NAV_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-[#E2B755] via-[#E6C371] to-[#D4A63B] text-black shadow-[0_10px_25px_rgba(226,183,85,0.25)] scale-[1.02]' 
                                            : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100 border border-transparent hover:border-zinc-800'
                                    }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-black' : 'text-zinc-400'} />
                                    <div className="text-left">
                                        <div className="leading-none">{tab.label}</div>
                                        <div className={`text-[10px] mt-1 ${isActive ? 'text-black/70 font-bold' : 'text-zinc-600'} tracking-tight`}>{tab.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900/60 border border-zinc-800 hover:border-[#E2B755]/50 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                        <Globe size={16} className="text-[#E2B755]" />
                        <span>Voltar ao Admin Local</span>
                    </button>
                    <button 
                        onClick={async () => {
                            await signOut();
                            navigate('/login', { replace: true });
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <LogOut size={16} />
                        <span>Sair do Sistema</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col overflow-y-auto bg-[#0F0E0E] p-4 sm:p-8 relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2B755]/5 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32" />

                {/* TOP BAR */}
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 pb-6 border-b border-zinc-800/80 relative z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-[#E2B755]/10 text-[#E2B755] md:hidden">👑</span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                {NAV_TABS.find(t => t.id === activeTab)?.label || 'Gestão SaaS'}
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                            {activeTab === 'restaurants' ? 'Controlo, herança de permissões e monitorização de subscrições.' :
                             activeTab === 'users' ? 'Gestão de níveis de acesso, aprovações de registo e auditoria.' :
                             activeTab === 'finance' ? 'Inteligência financeira, faturação MRR e distribuição de planos.' :
                             activeTab === 'notifications' ? 'Emissão de altifalante global e histórico de transmissão.' :
                             activeTab === 'settings' ? 'Personalização do logótipo global e identidade visual.' :
                             'Métricas em tempo real e saúde do ecossistema Jindungo Global.'}
                        </p>
                    </div>

                    <div className="flex gap-3 items-center">
                        {activeTab === 'restaurants' && (
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-[#E2B755] to-[#D4A63B] hover:brightness-110 text-black px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_5px_20px_rgba(226,183,85,0.3)] active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                                <Plus size={18} />
                                Novo Cliente
                            </button>
                        )}
                        <span className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            API Sincronizada
                        </span>
                    </div>
                </header>

                {/* METRICS / KPI CARDS (High legibility fonts & trend indicators) */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 relative z-10">
                    {[
                        { label: 'Clientes Totais', value: stats.totalRestaurants, icon: Users, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', trend: '+12% este mês', tab: 'restaurants' },
                        { label: 'Clientes Ativos', value: stats.activeRestaurants, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', trend: `${Math.round((stats.activeRestaurants/Math.max(1, stats.totalRestaurants))*100)}% de conversão`, tab: 'restaurants' },
                        { label: 'Acessos Simultâneos', value: stats.totalUsers, icon: ShieldCheck, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', trend: 'Auditoria RLS Ativa', tab: 'users' },
                        { label: 'Itens Registados', value: stats.totalItems, icon: Zap, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', trend: 'Alta Performance', tab: 'overview' },
                    ].map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <div 
                                key={i} 
                                onClick={() => setActiveTab(card.tab)}
                                className="bg-[#141212] border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-600 transition-all cursor-pointer group shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">{card.label}</p>
                                        <p className="text-3xl font-black mt-2 tracking-tight text-white font-mono group-hover:text-[#E2B755] transition-colors">{card.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-2xl border ${card.color} group-hover:scale-110 transition-transform shadow-inner`}>
                                        <Icon size={22} />
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1.5">
                                    <span className="text-[#E2B755]">↗</span> {card.trend}
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* TAB CONTENT AREA */}
                <div className="flex-1 flex flex-col relative z-10 min-h-[450px]">
                    
                    {/* RESTAURANTS TAB */}
                    {activeTab === 'restaurants' && (
                        <section className="bg-[#141212] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-2xl">
                            {/* SEARCH & FILTERS */}
                            <div className="p-5 border-b border-zinc-800 bg-[#161414] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Pesquisar por nome, link ou email do cliente..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#1C1A1A] border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#E2B755] focus:ring-1 focus:ring-[#E2B755] transition-all font-medium"
                                    />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                                    <span>Mostrando <b className="text-white font-mono">{paginatedRestaurants.length}</b> de <b className="text-white font-mono">{filteredRestaurants.length}</b> clientes</span>
                                    <button onClick={fetchData} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors" title="Atualizar Dados">
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold tracking-wider bg-[#161414]/50">
                                            <th className="p-4 pl-6 uppercase font-mono">Restaurante / Link</th>
                                            <th className="p-4 uppercase font-mono">Responsável / ID</th>
                                            <th className="p-4 uppercase font-mono">Faturação (Validade)</th>
                                            <th className="p-4 uppercase font-mono">Sistema</th>
                                            <th className="p-4 pr-6 text-right uppercase font-mono">Ações SaaS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                                        {paginatedRestaurants.map((client) => {
                                            const expired = isExpired(client.valid_until);
                                            return (
                                                <tr key={client.id} className="hover:bg-zinc-900/60 transition-colors group">
                                                    {/* RESTAURANTE / LINK */}
                                                    <td className="p-4 pl-6 flex items-center gap-3.5 whitespace-nowrap">
                                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E2B755]/20 to-black border border-[#E2B755]/30 flex items-center justify-center font-bold text-base text-[#E2B755] group-hover:scale-110 group-hover:border-[#E2B755] transition-all shadow-[0_4px_10px_rgba(226,183,85,0.15)] font-serif">
                                                            {client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-zinc-100 group-hover:text-[#E2B755] transition-colors">{client.name}</div>
                                                            <a href={`/r/${client.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-[#E2B755] transition-colors flex items-center gap-1 mt-0.5 font-mono">
                                                                <span>jindungo.ao/</span><span className="text-zinc-300 font-bold">{client.slug}</span> ↗
                                                            </a>
                                                        </div>
                                                    </td>

                                                    {/* RESPONSÁVEL */}
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-zinc-200">{client.profiles?.email || 'Nenhum Dono'}</div>
                                                        <div className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md w-fit mt-1">ID: {client.owner_id?.substring(0, 8) || 'N/A'}</div>
                                                    </td>

                                                    {/* FATURAÇÃO */}
                                                    <td className="p-4 whitespace-nowrap">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-[#E2B755] rounded-lg text-xs font-bold tracking-wider font-mono">
                                                            {client.plan || 'Start'}
                                                        </div>
                                                        <div className={`text-xs mt-1.5 font-medium ${expired ? 'text-red-400' : 'text-emerald-400'}`}>
                                                            {expired ? 'Expirou: ' : 'Vence: '} {formatDate(client.valid_until)}
                                                        </div>
                                                    </td>

                                                    {/* STATUS SISTEMA */}
                                                    <td className="p-4 whitespace-nowrap">
                                                        <button 
                                                            onClick={() => toggleRestaurantStatus(client.id, client.status)}
                                                            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                                        >
                                                            {client.status === 'active' ? (
                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)] font-mono">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
                                                                    Ativo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/60 border border-red-800/80 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-mono">
                                                                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444]" />
                                                                    Bloqueado
                                                                </span>
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* AÇÕES SAAS */}
                                                    <td className="p-4 pr-6 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => setRenewModal({ isOpen: true, restaurant: client, selectedPlan: PLANS[1], selectedTier: { id: 'start', name: 'Start' }, customDays: 0 })}
                                                                title="Renovar ou Alterar Plano SaaS" 
                                                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-[#E2B755] text-zinc-300 hover:text-black transition-all cursor-pointer shadow-sm hover:scale-110"
                                                            >
                                                                <CreditCard size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setInvoiceConfigModal({ isOpen: true, restaurant: client })}
                                                                title="Configurar Layout da Fatura (AGT)" 
                                                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-[#E2B755] text-zinc-300 hover:text-black transition-all cursor-pointer shadow-sm hover:scale-110"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handlePopulateDemo(client.id, client.name)}
                                                                title="Injetar Menu de Demonstração (Teste)" 
                                                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-blue-500 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm hover:scale-110"
                                                            >
                                                                <Sliders size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleMasquerade(client.id)}
                                                                title="Inspecionar como Proprietário (Masquerade)" 
                                                                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-white text-zinc-300 hover:text-black transition-all cursor-pointer shadow-sm hover:scale-110"
                                                            >
                                                                <ShieldCheck size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setDeleteModal({ isOpen: true, restaurant: client, confirmName: '' })}
                                                                title="Eliminar Cliente Crítico" 
                                                                className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-600 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-sm hover:scale-110"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* EMPTY STATES */}
                            {filteredRestaurants.length === 0 && (
                                <div className="p-16 text-center text-zinc-500 font-medium">
                                    <span className="text-4xl block mb-3 opacity-30">📭</span>
                                    Nenhum cliente ou restaurante encontrado com o filtro atual.
                                </div>
                            )}

                            {/* PAGINATION FOOTER */}
                            {totalRestaurantPages > 1 && (
                                <div className="p-4 border-t border-zinc-800 bg-[#161414] flex items-center justify-between text-xs text-zinc-400">
                                    <div>
                                        A mostrar <b className="text-white">{(currentPage - 1) * itemsPerPage + 1}</b> - <b className="text-white">{Math.min(currentPage * itemsPerPage, filteredRestaurants.length)}</b> de <b className="text-white">{filteredRestaurants.length}</b>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition border border-zinc-700 font-bold uppercase tracking-wider text-[10px]"
                                        >
                                            Anterior
                                        </button>
                                        <span className="font-bold text-white font-mono px-1">{currentPage} / {totalRestaurantPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalRestaurantPages, p + 1))}
                                            disabled={currentPage === totalRestaurantPages}
                                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition border border-zinc-700 font-bold uppercase tracking-wider text-[10px]"
                                        >
                                            Próximo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <section className="bg-[#141212] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-2xl">
                            <div className="p-5 border-b border-zinc-800 bg-[#161414] flex items-center justify-between">
                                <div className="relative w-full max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Pesquisar utilizador por email ou ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#1C1A1A] border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-[#E2B755] transition-all font-medium"
                                    />
                                </div>
                                <div className="text-xs text-zinc-400 font-medium">
                                    Mostrando <b className="text-white font-mono">{paginatedUsers.length}</b> de <b className="text-white font-mono">{filteredUsers.length}</b> utilizadores
                                </div>
                            </div>

                            <div className="overflow-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold tracking-wider bg-[#161414]/50">
                                            <th className="p-4 pl-6 uppercase font-mono">Utilizador / Contacto</th>
                                            <th className="p-4 text-center uppercase font-mono">Nível de Acesso (Role)</th>
                                            <th className="p-4 text-center uppercase font-mono">Status / Segurança</th>
                                            <th className="p-4 pr-6 text-right uppercase font-mono">Auditoria SaaS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60">
                                        {paginatedUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-zinc-900/60 transition-colors group">
                                                <td className="p-4 pl-6 flex items-center gap-3.5 whitespace-nowrap">
                                                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 group-hover:border-white transition-all font-serif">
                                                        {u.full_name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-zinc-100 group-hover:text-[#E2B755] transition-colors">{u.full_name || 'Sem Nome'}</div>
                                                        <div className="text-xs text-zinc-400 mt-0.5">{u.email}</div>
                                                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.phone || 'Sem Telefone'}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs font-black rounded-lg border uppercase tracking-wider font-mono ${
                                                        u.role === 'super_admin' ? 'bg-purple-950/60 text-purple-400 border-purple-800/80 shadow-[0_0_15px_rgba(192,132,252,0.15)]' :
                                                        u.role === 'admin' ? 'bg-blue-950/60 text-blue-400 border-blue-800/80 shadow-[0_0_15px_rgba(96,165,250,0.15)]' :
                                                        'bg-zinc-800 text-zinc-300 border-zinc-700'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 inline-flex items-center gap-2 text-xs font-bold rounded-full font-mono ${
                                                        u.status === 'banned' ? 'bg-red-950/60 text-red-400 border border-red-800 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 
                                                        u.status === 'pending' ? 'bg-amber-950/60 text-amber-400 border border-amber-800 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
                                                        'bg-emerald-950/60 text-emerald-400 border border-emerald-800 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            u.status === 'banned' ? 'bg-red-500 shadow-[0_0_8px_#EF4444]' : 
                                                            u.status === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_#F59E0B]' :
                                                            'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                                                        }`}></span>
                                                        {u.status === 'banned' ? 'Banido' : u.status === 'pending' ? 'Pendente' : 'Ativo'}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right whitespace-nowrap">
                                                    <div className="flex gap-2 justify-end">
                                                        {u.status === 'pending' && (
                                                            <button
                                                                onClick={() => approveUser(u.id, u.email, u.phone, u.full_name)}
                                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse hover:animate-none cursor-pointer"
                                                            >
                                                                ✅ Aprovar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setEditingUser(u)}
                                                            className="px-3.5 py-2 rounded-xl bg-[#E2B755]/10 text-[#E2B755] border border-[#E2B755]/30 hover:bg-[#E2B755] hover:text-black font-bold text-xs transition-all shadow-sm cursor-pointer"
                                                        >
                                                            Permissões
                                                        </button>
                                                        {u.status !== 'pending' && (
                                                            <button
                                                                onClick={() => toggleUserProfileBan(u.id, u.status)}
                                                                className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all shadow-sm cursor-pointer ${
                                                                    u.status === 'banned'
                                                                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-500 hover:text-black'
                                                                        : 'bg-red-950/60 text-red-400 border-red-800 hover:bg-red-600 hover:text-white'
                                                                }`}
                                                            >
                                                                {u.status === 'banned' ? 'Desbloquear' : 'Banir'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION FOOTER */}
                            {totalUserPages > 1 && (
                                <div className="p-4 border-t border-zinc-800 bg-[#161414] flex items-center justify-between text-xs text-zinc-400">
                                    <div>
                                        A mostrar <b className="text-white">{(currentPage - 1) * itemsPerPage + 1}</b> - <b className="text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</b> de <b className="text-white">{filteredUsers.length}</b>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition border border-zinc-700 font-bold uppercase tracking-wider text-[10px]"
                                        >
                                            Anterior
                                        </button>
                                        <span className="font-bold text-white font-mono px-1">{currentPage} / {totalUserPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalUserPages, p + 1))}
                                            disabled={currentPage === totalUserPages}
                                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition border border-zinc-700 font-bold uppercase tracking-wider text-[10px]"
                                        >
                                            Próximo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#141212] border border-zinc-800 rounded-2xl p-7 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E2B755]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#E2B755]/20 transition-all duration-700" />
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <span className="p-3 rounded-2xl bg-[#E2B755]/10 text-[#E2B755] border border-[#E2B755]/20 shadow-inner text-xl">⚠️</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-white font-serif">Alertas de Subscrição</h3>
                                        <p className="text-xs text-zinc-400">Clientes com validade a expirar nos próximos 7 dias</p>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    {restaurants.filter(r => r.valid_until && Math.ceil((new Date(r.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 && Math.ceil((new Date(r.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) >= -30).slice(0, 5).map(rest => {
                                        const diffDays = Math.ceil((new Date(rest.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={rest.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                                                <div>
                                                    <p className="font-bold text-white text-sm">{rest.name}</p>
                                                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{rest.profiles?.email}</p>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-xl font-bold text-xs tracking-wider uppercase font-mono ${diffDays < 0 ? 'bg-red-950/60 text-red-400 border border-red-800' : 'bg-amber-950/60 text-amber-400 border border-amber-800'}`}>
                                                    {diffDays < 0 ? `Expirou (${Math.abs(diffDays)}d)` : `${diffDays} dias`}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {restaurants.filter(r => r.valid_until && Math.ceil((new Date(r.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) <= 7 && Math.ceil((new Date(r.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) >= -30).length === 0 && (
                                        <div className="p-12 text-center text-zinc-500 font-medium border border-zinc-800 rounded-xl bg-zinc-900/30">
                                            ✅ Nenhuma subscrição pendente de alerta no momento.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#141212] border border-zinc-800 rounded-2xl p-7 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <span className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner text-xl">🆕</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-white font-serif">Últimos Restaurantes</h3>
                                        <p className="text-xs text-zinc-400">Novas subscrições ativadas recentemente</p>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    {restaurants.slice(0, 4).map(rest => (
                                        <div key={rest.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[#E2B755] font-serif">
                                                    {rest.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{rest.name}</p>
                                                    <p className="text-xs text-[#E2B755] font-mono mt-0.5">{rest.plan || 'Start'}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-zinc-500 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800 font-mono">
                                                {formatDate(rest.created_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FINANCE TAB */}
                    {activeTab === 'finance' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-black/80 to-[#E2B755]/10 border border-[#E2B755]/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#E2B755]/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-[#E2B755]/20 transition-all" />
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <span className="p-3 rounded-2xl bg-[#E2B755]/20 text-[#E2B755] border border-[#E2B755]/30 text-xl font-bold">📊</span>
                                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Receita Mensal (MRR)</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <span className="text-4xl md:text-5xl font-black text-white font-mono group-hover:text-[#E2B755] transition-colors">{formatCurrency(totalMRR)}</span>
                                        <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider font-mono">/mês</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-800 relative z-10 font-sans">
                                        Projeção de faturação recorrente mensal de todas as subscrições ativas.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-black/80 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <span className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xl font-bold">💰</span>
                                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Recebíveis (Próximos 7 Dias)</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <span className="text-4xl md:text-5xl font-black text-emerald-400 font-mono">{formatCurrency(expiringRevenue7Days)}</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-800 relative z-10 font-sans">
                                        Renovações estimadas de restaurantes com expiração no ciclo semanal.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#141212] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                                <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                    <span className="p-2.5 rounded-xl bg-white/5 text-lg border border-white/10 shadow-inner">🥧</span>
                                    Distribuição de Planos SaaS
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    {Object.entries(planBreakdown).map(([planName, count]) => {
                                        const mappedPlan = ['Start', 'Business', 'Corporate', 'Free Trial'].includes(planName) ? planName : 'Start';
                                        return (
                                            <div key={planName} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between hover:border-[#E2B755]/50 transition-colors shadow-lg">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl p-3 rounded-2xl bg-zinc-800 border border-zinc-700">{TIER_PRICES[mappedPlan]?.icon || '📋'}</span>
                                                    <div>
                                                        <p className="font-bold text-white text-base font-serif">{planName}</p>
                                                        <p className="text-xs text-[#E2B755] font-mono mt-0.5">{formatCurrency(TIER_PRICES[mappedPlan]?.price || 0)}/mês</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-white font-mono">{count}</span>
                                                    <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Clientes</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="bg-[#141212] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-[#E2B755]/10 rounded-full blur-[80px] pointer-events-none" />
                                <div className="mb-6 relative z-10">
                                    <h3 className="text-xl font-bold text-white font-serif flex items-center gap-3">
                                        <span className="p-3 rounded-2xl bg-[#E2B755]/10 text-[#E2B755] border border-[#E2B755]/20 text-xl shadow-inner">📢</span>
                                        Emitir Notificação Global (Altifalante)
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">Transmita avisos de manutenção ou novidades em tempo real para o dashboard de todos os restaurantes.</p>
                                </div>

                                <form onSubmit={handleCreateNotification} className="space-y-5 relative z-10 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Título do Aviso</label>
                                            <input
                                                type="text"
                                                value={newNotification.title || ''}
                                                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                                                placeholder="Ex: Atualização do Sistema v3.1"
                                                className="w-full bg-black/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E2B755] transition-all font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Nível / Prioridade</label>
                                            <div className="flex gap-3">
                                                {['info', 'warning', 'danger', 'success'].map(type => (
                                                    <label key={type} className="flex-1 cursor-pointer">
                                                        <input type="radio" value={type} checked={newNotification.type === type} onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })} className="hidden" />
                                                        <div className={`py-3 rounded-xl border text-center text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 font-mono ${newNotification.type === type ? 
                                                            (type === 'info' ? 'bg-blue-500 text-black border-blue-500 font-black shadow-lg shadow-blue-500/20' : 
                                                             type === 'warning' ? 'bg-amber-500 text-black border-amber-500 font-black shadow-lg shadow-amber-500/20' :
                                                             type === 'danger' ? 'bg-red-500 text-white border-red-500 font-black shadow-lg shadow-red-500/20' :
                                                             'bg-emerald-500 text-black border-emerald-500 font-black shadow-lg shadow-emerald-500/20') : 
                                                            'bg-black/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'}`}>
                                                            {type === 'info' ? 'ℹ️ Info' : type === 'warning' ? '⚠️ Aviso' : type === 'danger' ? '🚨 Urgente' : '✅ Sucesso'}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Conteúdo da Mensagem</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="w-full bg-black/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E2B755] resize-none font-medium"
                                            placeholder="Descreva os detalhes da notificação ou manutenção programada..."
                                            value={newNotification.message}
                                            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                                        ></textarea>
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSendingNotification || !newNotification.message.trim()}
                                        className="w-full py-3.5 bg-gradient-to-r from-[#E2B755] via-[#E6C371] to-[#D4A63B] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_5px_20px_rgba(226,183,85,0.3)] active:scale-95 cursor-pointer font-mono"
                                    >
                                        {isSendingNotification ? 'A Publicar Altifalante Global...' : 'Emitir Notificação Global'}
                                    </button>
                                </form>
                            </div>

                            <div className="bg-[#141212] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-800">
                                    <span className="text-xl">📜</span>
                                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">Histórico de Mensagens Ativas e Arquivadas</h4>
                                </div>
                                <div className="divide-y divide-zinc-800/80 max-h-[350px] overflow-y-auto pr-2">
                                    {notifications.length === 0 ? (
                                        <div className="p-12 text-center text-zinc-500 font-medium">Nenhum aviso transmitido até ao momento.</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div key={notif.id} className={`py-4 flex flex-col gap-2.5 transition-colors ${notif.is_active ? 'opacity-100' : 'opacity-50'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono border ${notif.type === 'info' ? 'bg-blue-950/60 text-blue-400 border-blue-800' :
                                                            notif.type === 'warning' ? 'bg-amber-950/60 text-amber-400 border-amber-800' :
                                                            notif.type === 'danger' ? 'bg-red-950/60 text-red-400 border-red-800' :
                                                            'bg-emerald-950/60 text-emerald-400 border-emerald-800'}`}>
                                                            {notif.type}
                                                        </span>
                                                        <span className="text-xs font-bold text-white font-serif">{notif.title || 'Aviso do Sistema'}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => toggleNotificationState(notif.id, notif.is_active)} 
                                                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${notif.is_active ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-black' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-black'}`}
                                                        >
                                                            {notif.is_active ? 'Arquivar' : 'Reativar'}
                                                        </button>
                                                        <button onClick={() => deleteNotification(notif.id)} className="p-2 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Apagar Definitivamente">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{notif.message}</p>
                                                <span className="text-[10px] text-zinc-500 font-mono">{formatDate(notif.created_at)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="bg-[#141212] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-[#E2B755]/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800 relative z-10">
                                <span className="p-3 rounded-2xl bg-[#E2B755]/10 text-[#E2B755] border border-[#E2B755]/20 text-xl shadow-inner">🎨</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-serif">Definições da Marca & Logótipo Global</h3>
                                                    <p className="text-xs text-zinc-400">Proporções blindadas e identidade visual premium</p>
                                </div>
                            </div>

                            <p className="text-zinc-300 text-sm mb-6 leading-relaxed max-w-3xl relative z-10 font-sans">
                                Substitua a imagem global usada no topo do Admin e Menus. A imagem será perfeitamente adaptada via CSS sem distorcer, mantendo a excelência do visual *Noir & Gold*.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10 bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800">
                                <div className="w-64 h-64 bg-black border border-zinc-700 hover:border-[#E2B755]/50 rounded-[2.5rem] flex items-center justify-center p-0 shadow-2xl relative group overflow-hidden shrink-0 transition-all duration-300">
                                    <img src={globalLogoUrl} alt="Logo Atual" className="w-full h-full object-contain scale-[1.18] group-hover:scale-[1.23] transition-all duration-300" />
                                </div>
                                <div className="flex flex-col gap-4 w-full sm:w-auto">
                                    <label className="bg-gradient-to-r from-[#E2B755] to-[#D4A63B] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-[0_10px_25px_rgba(226,183,85,0.25)] text-center font-mono">
                                        <span>Carregar Novo Logótipo (PNG/WEBP)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const loadingToast = toast.loading('A propagar logótipo pelo ecossistema Jindungo...');
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
                                            const loadingToast = toast.loading('A restaurar logótipo padrão...');
                                            try {
                                                const res = await updateLogoUrl('/jindungo_logo_v3.png');
                                                if (res?.error) throw res.error;
                                                toast.success('Logótipo padrão Noir & Gold restaurado.', { id: loadingToast });
                                            } catch (err) {
                                                console.error('Error restoring logo:', err);
                                                toast.error('Falhou a restaurar.', { id: loadingToast });
                                            }
                                        }}
                                        className="text-zinc-400 hover:text-white text-xs font-bold underline transition-colors w-fit font-mono cursor-pointer mx-auto sm:mx-0"
                                    >
                                        Restaurar Logótipo Padrão
                                    </button>
                                    <p className="text-xs text-zinc-500 font-mono">Formatos recomendados com fundo transparente: PNG, SVG ou WEBP.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM MOBILE NAVIGATION */}
                <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] z-50">
                    <div className="bg-[#141212]/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                        {NAV_TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                                        isActive 
                                            ? 'bg-[#E2B755] text-black font-bold scale-105 shadow-lg shadow-[#E2B755]/20' 
                                            : 'text-zinc-500 hover:text-zinc-300 font-medium'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-[10px] font-mono uppercase tracking-tighter leading-none">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* SAAS: ADD RESTAURANT MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#121213] border border-[#E2B755]/40 rounded-[2.5rem] p-8 max-w-md w-full my-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E2B755]/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
                        
                        <div className="text-center mb-8 relative z-10">
                            <span className="p-3.5 inline-block bg-[#E2B755]/10 text-[#E2B755] rounded-2xl mb-3 border border-[#E2B755]/20 text-2xl shadow-inner font-serif">✦</span>
                            <h3 className="text-2xl font-black text-white font-serif tracking-tight">Novo Cliente (Restaurante)</h3>
                            <p className="text-xs text-zinc-400 mt-1">Registe e atribua um novo negócio na infraestrutura Jindungo</p>
                        </div>

                        <form onSubmit={handleCreateRestaurant} className="space-y-5 relative z-10 font-sans">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Nome do Restaurante</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/80 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#E2B755] transition-all font-medium text-sm"
                                    placeholder="Ex: Restaurante Sabores da Terra"
                                    value={newRest.name}
                                    onChange={(e) => setNewRest({ ...newRest, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">URL Personalizado / Link</label>
                                <div className="flex bg-black/80 rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-[#E2B755] transition-all">
                                    <span className="flex items-center px-4 bg-zinc-900 text-zinc-500 font-mono text-xs border-r border-zinc-800">jindungo.ao/</span>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-transparent px-4 py-3.5 text-white focus:outline-none font-mono text-sm font-bold"
                                        placeholder="sabores-da-terra"
                                        value={newRest.slug}
                                        onChange={(e) => setNewRest({ ...newRest, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Proprietário (Responsável)</label>
                                <select
                                    required
                                    className="w-full bg-black/80 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#E2B755] transition-all text-sm font-medium"
                                    value={newRest.owner_id}
                                    onChange={(e) => setNewRest({ ...newRest, owner_id: e.target.value })}
                                >
                                    <option value="" disabled className="text-zinc-500">Selecione o utilizador responsável...</option>
                                    {usersList.map(u => (
                                        <option key={u.id} value={u.id} className="bg-[#0A0A0B]">{u.email} ({u.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-6 border-t border-zinc-800 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-[#E2B755] to-[#D4A63B] hover:brightness-110 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-[#E2B755]/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer font-mono"
                                >
                                    {isCreating ? 'A Registar...' : 'Criar Negócio'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SAAS: EDIT ROLE MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#121213] border border-[#E2B755]/40 rounded-[2.5rem] p-8 max-w-md w-full my-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E2B755]/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
                        
                        <div className="text-center mb-8 border-b border-zinc-800/80 pb-6 relative z-10">
                            <span className="p-3 inline-block bg-[#E2B755]/10 text-[#E2B755] rounded-2xl mb-2 text-xl font-bold border border-[#E2B755]/20 font-serif">🔑</span>
                            <h3 className="text-2xl font-black text-white font-serif tracking-tight">Nível de Permissão (Role)</h3>
                            <p className="text-xs text-[#E2B755] font-mono mt-1">{editingUser.email}</p>
                        </div>

                        <div className="space-y-4 relative z-10 font-sans">
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, 'super_admin')}
                                className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${editingUser.role === 'super_admin' ? 'bg-purple-950/60 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'}`}
                            >
                                <div>
                                    <span className="block text-base font-bold font-mono">Super Admin 👑</span>
                                    <span className="block text-xs font-normal text-zinc-500 mt-1">Acesso irrestrito a todos os clientes e painel SaaS global.</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, 'admin')}
                                className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${editingUser.role === 'admin' ? 'bg-[#E2B755]/20 border-[#E2B755] text-[#E2B755] shadow-[0_0_20px_rgba(226,183,85,0.2)]' : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-[#E2B755]/50 hover:text-white'}`}
                            >
                                <div>
                                    <span className="block text-base font-bold font-mono">Administrador (Dono) 🍽️</span>
                                    <span className="block text-xs font-normal text-zinc-500 mt-1">Proprietário de restaurante. Gere ementa e equipa própria.</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleUpdateRole(editingUser.id, 'client')}
                                className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${editingUser.role === 'client' ? 'bg-zinc-800 border-white text-white shadow-lg' : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'}`}
                            >
                                <div>
                                    <span className="block text-base font-bold font-mono">Cliente Final 📱</span>
                                    <span className="block text-xs font-normal text-zinc-500 mt-1">Utilizador consumidor do menu digital via QR code.</span>
                                </div>
                            </button>
                        </div>

                        <div className="pt-8 relative z-10 border-t border-zinc-800 mt-6">
                            <button onClick={() => setEditingUser(null)} className="w-full py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer font-mono">Cancelar / Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SAAS: RENEW PLAN MODAL */}
            {renewModal.isOpen && renewModal.restaurant && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#121213] border border-[#E2B755]/40 rounded-[2.5rem] p-8 max-w-md w-full my-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
                        
                        <div className="text-center mb-8 pb-6 border-b border-zinc-800 relative z-10 font-serif">
                            <span className="p-3.5 inline-block bg-emerald-500/10 text-emerald-400 rounded-2xl mb-2 text-2xl border border-emerald-500/20 shadow-inner font-serif">💳</span>
                            <h3 className="text-2xl font-black text-white tracking-tight">Faturação e Plano</h3>
                            <p className="text-xs text-[#E2B755] font-mono mt-1 font-bold">{renewModal.restaurant.name}</p>
                        </div>

                        <div className="space-y-6 mb-8 relative z-10 font-sans">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">1. Escolha o Nível de Assinatura (SaaS Tier):</label>
                                <div className="grid grid-cols-3 gap-3 font-serif">
                                    {[
                                        { id: 'start', name: 'Start' },
                                        { id: 'business', name: 'Business' },
                                        { id: 'corporate', name: 'Corporate' }
                                    ].map(tier => (
                                        <button
                                            key={tier.id}
                                            onClick={() => setRenewModal({ ...renewModal, selectedTier: tier })}
                                            className={`p-3.5 rounded-2xl border text-sm font-bold transition-all text-center cursor-pointer ${renewModal.selectedTier?.id === tier.id
                                                ? 'bg-gradient-to-r from-[#E2B755] to-[#D4A63B] text-black border-[#E2B755] shadow-lg shadow-[#E2B755]/20 scale-105'
                                                : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'}`}
                                        >
                                            {tier.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">2. Escolha o Ciclo / Duração:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PLANS.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setRenewModal({ ...renewModal, selectedPlan: plan })}
                                            className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer font-mono ${plan.id === 'manual' ? 'col-span-2' : ''} ${renewModal.selectedPlan?.id === plan.id
                                                ? 'bg-zinc-800 text-white border-[#E2B755] shadow-lg shadow-[#E2B755]/10 font-black'
                                                : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'}`}
                                        >
                                            {plan.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {renewModal.selectedPlan?.id === 'manual' && (
                                <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 animate-in fade-in">
                                    <label className="block text-xs font-bold text-zinc-300 mb-2 font-mono text-center">Dias a Adicionar ou Retirar (Ajuste Exato)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E2B755] text-center font-bold text-base"
                                        placeholder="Ex: 15 ou -30"
                                        value={renewModal.customDays || ''}
                                        onChange={(e) => setRenewModal({ ...renewModal, customDays: e.target.value })}
                                    />
                                    <p className="text-[10px] text-zinc-500 font-mono mt-2 text-center">Use o sinal de menos (-) para reduzir a validade.</p>
                                </div>
                            )}

                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2 font-mono text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500 uppercase">Situação Atual:</span>
                                    <span className={`font-bold ${isExpired(renewModal.restaurant.valid_until) ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {isExpired(renewModal.restaurant.valid_until) ? 'Expirado' : 'Ativo'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-sans">
                                    <span className="text-zinc-500 uppercase font-mono text-[11px]">Nova Data de Validade:</span>
                                    <span className="text-sm font-black text-[#E2B755] font-mono">
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

                        <div className="pt-6 border-t border-zinc-800 flex gap-3 relative z-10 font-mono">
                            <button
                                onClick={() => setRenewModal({ isOpen: false, restaurant: null, selectedPlan: null, selectedTier: null, customDays: 0 })}
                                className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-bold text-xs uppercase transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmRenewal}
                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                            >
                                Confirmar Faturação
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SAAS: INVOICE CONFIG MODAL */}
            {invoiceConfigModal.isOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto text-white">
                    <div className="bg-[#141212] border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 max-w-2xl w-full my-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-[#E2B755]/5 blur-[90px] rounded-full pointer-events-none -mr-24 -mt-24" />

                        <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6">
                            <div>
                                <h3 className="text-xl font-serif font-black text-white flex items-center gap-2">
                                    <FileText className="text-[#E2B755]" size={20} />
                                    Configuração Fiscal da Fatura
                                </h3>
                                <p className="text-zinc-500 text-xs mt-1">
                                    Configurar o layout de impressão e dados de integração AGT para <span className="text-[#E2B755] font-bold">"{invoiceConfigModal.restaurant?.name}"</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setInvoiceConfigModal({ isOpen: false, restaurant: null })}
                                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <XCircle size={16} />
                            </button>
                        </div>

                        <div className="space-y-6 font-sans max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            
                            {/* Seção 1: Identidade Fiscal */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[#E2B755] uppercase tracking-wider border-b border-zinc-800/80 pb-1.5 flex items-center gap-1.5">
                                    <Settings2 size={13} /> Identidade Fiscal (Emitente)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">NIF do Restaurante</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E2B755] font-bold"
                                            placeholder="Ex: 5417289301"
                                            value={localInvoiceConfig.nif}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, nif: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Morada Comercial</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E2B755] font-bold"
                                            placeholder="Ex: Av. Talatona, Edifício Jindungo, Luanda"
                                            value={localInvoiceConfig.address}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seção 2: Parametrização AGT */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[#E2B755] uppercase tracking-wider border-b border-zinc-800/80 pb-1.5 flex items-center gap-1.5">
                                    <ShieldCheck size={13} /> Parâmetros de Certificação (AGT)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">N.º Certificação Software</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2B755] font-bold"
                                            value={localInvoiceConfig.certification_number}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, certification_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Versão do Software</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2B755] font-bold"
                                            value={localInvoiceConfig.software_version}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, software_version: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Nota de Rodapé da Fatura</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E2B755] font-bold"
                                            placeholder="Ex: Regime Geral de Faturação"
                                            value={localInvoiceConfig.invoice_footer_note}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, invoice_footer_note: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seção 3: Regime de IVA */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[#E2B755] uppercase tracking-wider border-b border-zinc-800/80 pb-1.5 flex items-center gap-1.5">
                                    <CreditCard size={13} /> Configuração de Imposto (IVA)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Taxa de IVA (%)</label>
                                        <select
                                            className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2B755] font-bold"
                                            value={localInvoiceConfig.vat_rate}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, vat_rate: Number(e.target.value) })}
                                        >
                                            <option value={14}>Geral (14%)</option>
                                            <option value={7}>Simplificado (7%)</option>
                                            <option value={0}>Isento (0%)</option>
                                        </select>
                                    </div>
                                    
                                    {localInvoiceConfig.vat_rate === 0 && (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Código de Isenção (AGT)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E2B755] font-bold"
                                                    placeholder="Ex: M10"
                                                    value={localInvoiceConfig.exemption_code}
                                                    onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, exemption_code: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Motivo de Isenção</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-black/60 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E2B755] font-bold"
                                                    placeholder="Ex: Isento nos termos do CIVA"
                                                    value={localInvoiceConfig.exemption_reason}
                                                    onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, exemption_reason: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Seção 4: Configuração Visual do Layout */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[#E2B755] uppercase tracking-wider border-b border-zinc-800/80 pb-1.5 flex items-center gap-1.5">
                                    <Sliders size={13} /> Estética e Layout da Fatura
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-black/30 p-4 rounded-2xl border border-zinc-850/50">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Cor de Destaque do Layout</label>
                                        <div className="flex gap-3">
                                            {[
                                                { name: 'Ouro', hex: '#D4AF37' },
                                                { name: 'Azul', hex: '#3B82F6' },
                                                { name: 'Esmeralda', hex: '#10B981' },
                                                { name: 'Carmim', hex: '#EF4444' }
                                            ].map((color) => (
                                                <button
                                                    key={color.hex}
                                                    type="button"
                                                    onClick={() => setLocalInvoiceConfig({ ...localInvoiceConfig, layout_color: color.hex })}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer hover:scale-115 flex items-center justify-center ${localInvoiceConfig.layout_color === color.hex ? 'border-white' : 'border-transparent'}`}
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name}
                                                >
                                                    {localInvoiceConfig.layout_color === color.hex && <span className="text-[10px] text-white">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="show_logo_check"
                                            className="w-4 h-4 rounded border-zinc-800 bg-black text-[#E2B755] focus:ring-[#E2B755] transition-all cursor-pointer"
                                            checked={localInvoiceConfig.show_logo}
                                            onChange={(e) => setLocalInvoiceConfig({ ...localInvoiceConfig, show_logo: e.target.checked })}
                                        />
                                        <label htmlFor="show_logo_check" className="text-xs font-bold text-zinc-300 select-none cursor-pointer">
                                            Exibir Logótipo do Restaurante no Topo da Fatura
                                        </label>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="pt-6 border-t border-zinc-800 flex gap-3 mt-6 relative z-10 font-mono">
                            <button
                                onClick={() => setInvoiceConfigModal({ isOpen: false, restaurant: null })}
                                className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-bold text-xs uppercase transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveInvoiceConfig}
                                className="flex-1 py-3.5 bg-[#E2B755] hover:bg-yellow-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-[#E2B755]/20 active:scale-95 transition-all cursor-pointer"
                            >
                                Gravar Definições
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SAAS: DELETE CRITICAL MODAL */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-[#121213] border border-red-500/40 rounded-[2.5rem] p-8 max-w-md w-full my-8 shadow-[0_25px_70px_rgba(239,68,68,0.2)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
                        
                        <div className="text-center mb-6 relative z-10 font-serif">
                            <span className="p-3.5 inline-block bg-red-500/10 text-red-500 rounded-2xl mb-2 text-2xl border border-red-500/20 shadow-inner font-serif">🗑️</span>
                            <h3 className="text-2xl font-black text-red-500 tracking-tight">Eliminação de Conta</h3>
                        </div>

                        <p className="text-zinc-300 text-xs text-center mb-6 leading-relaxed relative z-10 font-sans">
                            Atenção! Esta ação é <b className="text-white">IRREVERSÍVEL</b>. O restaurante <b className="text-[#E2B755]">"{deleteModal.restaurant?.name}"</b> será apagado, juntamente com todos os pratos, categorias e histórico.
                        </p>

                        <div className="space-y-4 relative z-10 font-sans">
                            <div className="bg-black/80 border border-zinc-800 rounded-2xl p-5 text-center">
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">Para confirmar, digite o nome exato:</label>
                                <span className="text-white font-black bg-zinc-900 px-4 py-2 rounded-xl inline-block mb-3 border border-zinc-800 select-all font-mono text-sm">{deleteModal.restaurant?.name}</span>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-red-500/40 rounded-xl px-4 py-3 text-white text-center font-bold text-sm focus:outline-none focus:border-red-500 transition-colors"
                                    placeholder="Escreva o nome do restaurante..."
                                    value={deleteModal.confirmName}
                                    onChange={(e) => setDeleteModal({ ...deleteModal, confirmName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-800 flex gap-3 mt-6 relative z-10 font-mono">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, restaurant: null, confirmName: '' })}
                                className="flex-1 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteModal.confirmName !== deleteModal.restaurant?.name}
                                className={`flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                    deleteModal.confirmName === deleteModal.restaurant?.name
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 active:scale-95'
                                        : 'bg-red-950/30 border border-red-900/40 text-red-500/40 cursor-not-allowed'
                                }`}
                            >
                                Eliminar Definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;

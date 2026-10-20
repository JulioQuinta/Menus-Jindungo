import React, { useState, useEffect, useCallback } from 'react';
import {
    ChefHat, Utensils, Bell, CheckCircle2, Clock, Plus, Minus, Search,
    LogOut, Users, Receipt, Volume2, VolumeX, Flame, RefreshCw, CreditCard,
    Sparkles, ShieldCheck, ArrowRight, Coffee, ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';
import { db } from '../lib/localDb';
import ReceiptModal from './ReceiptModal';
import InvoicesManager from './InvoicesManager';
import { getAssetPath } from '../utils/assetResolver';

export const normalizeStaffRole = (rawRole = '') => {
    const r = String(rawRole || '').toLowerCase().trim();
    if (r.includes('kitchen') || r.includes('cozinha') || r.includes('chef') || r.includes('cozinheir') || r.includes('prep')) {
        return 'kitchen';
    }
    if (r.includes('reception') || r.includes('caixa') || r.includes('cashier') || r.includes('balc') || r.includes('pos')) {
        return 'reception';
    }
    if (r.includes('admin') || r.includes('gerente') || r.includes('manager') || r.includes('dono') || r.includes('owner')) {
        return 'admin';
    }
    // Default para Garçom / Sala ('waiter', 'garçom', 'garcom', 'atendente', etc.)
    return 'waiter';
};

const TABLES_LIST = [
    'Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5',
    'Mesa 6', 'Mesa 7', 'Mesa 8', 'Esplanada 1', 'Esplanada 2',
    'Sala VIP', 'Balcão / Take-Away'
];

const StaffTerminalView = ({
    restaurant,
    activeStaff,
    categories = [],
    onSwitchOperator,
    onExitStaffMode
}) => {
    const normalizedRole = normalizeStaffRole(activeStaff?.role);
    const restaurantId = restaurant?.id;
    const restaurantName = restaurant?.name || 'Comidas da Terra';

    // Shared Realtime Orders State
    const [orders, setOrders] = useState([]);
    const [waiterCalls, setWaiterCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Waiter Terminal Tabs: 'passes_mesas' | 'novo_pedido' | 'contas'
    const [waiterTab, setWaiterTab] = useState('passes_mesas');

    // Waiter New Order State
    const [selectedTable, setSelectedTable] = useState('Mesa 1');
    const [customerName, setCustomerName] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [searchDish, setSearchDish] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [menuCatalog, setMenuCatalog] = useState([]);
    const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 15000);
        return () => clearInterval(timer);
    }, []);

    // Load Menu Catalog (from props.categories or Supabase/IndexedDB)
    useEffect(() => {
        const flattened = [];
        if (Array.isArray(categories) && categories.length > 0) {
            categories.forEach(cat => {
                (cat.items || cat.menu_items || []).forEach(item => {
                    if (item.available !== false) {
                        flattened.push({
                            ...item,
                            categoryLabel: cat.label || cat.name || 'Menu'
                        });
                    }
                });
            });
        }
        if (flattened.length > 0) {
            setMenuCatalog(flattened);
        } else if (restaurantId) {
            supabase
                .from('menu_items')
                .select('*, categories(label)')
                .eq('restaurant_id', restaurantId)
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setMenuCatalog(data.map(i => ({ ...i, categoryLabel: i.categories?.label || 'Menu' })));
                    } else {
                        db.menu_items.where('restaurant_id').equals(restaurantId).toArray().then(local => {
                            setMenuCatalog(local || []);
                        });
                    }
                });
        }
    }, [categories, restaurantId]);

    const fetchActiveOrders = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const { data } = await orderService.getActiveOrders(restaurantId);
            setOrders(data || []);
        } catch (e) {
            console.warn('Erro ao carregar pedidos no terminal:', e);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    const fetchWaiterCalls = useCallback(async () => {
        if (!restaurantId || !navigator.onLine) return;
        try {
            const { data } = await supabase
                .from('notificacoes_garcom')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('status', 'pendente')
                .order('created_at', { ascending: false });
            if (data) setWaiterCalls(data);
        } catch (e) {
            // Silencioso se offline
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchActiveOrders();
        fetchWaiterCalls();

        const interval = setInterval(() => {
            fetchActiveOrders();
            fetchWaiterCalls();
        }, 8000);

        let channel = null;
        if (restaurantId) {
            channel = orderService.subscribeToOrders(restaurantId, () => {
                fetchActiveOrders();
                if (audioEnabled) {
                    try {
                        const bell = new Audio('/bell.mp3');
                        bell.volume = 0.6;
                        bell.play().catch(() => {});
                    } catch (e) {}
                }
            });
        }

        return () => {
            clearInterval(interval);
            if (channel) supabase.removeChannel(channel);
        };
    }, [restaurantId, fetchActiveOrders, fetchWaiterCalls, audioEnabled]);

    // Actions for Kitchen & Waiter
    const handleUpdateOrderStatus = async (orderId, nextStatus, customToast) => {
        try {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
            await orderService.updateOrderStatus(orderId, nextStatus, null, {
                staff_member_name: activeStaff?.name || null
            });
            toast.success(customToast || 'Estado do pedido atualizado!');
            fetchActiveOrders();
        } catch (e) {
            toast.error('Erro ao atualizar pedido.');
            fetchActiveOrders();
        }
    };

    const handleResolveWaiterCall = async (callId, mesaId) => {
        try {
            setWaiterCalls(prev => prev.filter(c => c.id !== callId));
            await supabase.from('notificacoes_garcom').update({ status: 'atendido' }).eq('id', callId);
            toast.success(`Mesa ${mesaId} marcada como atendida!`);
        } catch (e) {
            toast.error('Erro ao confirmar chamada.');
        }
    };

    // Waiter Cart Helpers
    const addToWaiterCart = (item) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price: parseFloat(item.price) || 0, quantity: 1, notes: '' }];
        });
    };

    const updateCartQty = (id, delta) => {
        setCart(prev => prev.map(i => {
            if (i.id !== id) return i;
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
        }).filter(Boolean));
    };

    const handleSendWaiterOrderToKitchen = async () => {
        if (cart.length === 0) {
            toast.error('Adicione pelo menos um prato ou bebida à comanda.');
            return;
        }
        setSubmittingOrder(true);
        try {
            const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const itemsWithNotes = cart.map((i, idx) => ({
                ...i,
                notes: idx === 0 && orderNotes.trim() ? orderNotes.trim() : (i.notes || '')
            }));

            const isTakeawayOrder = selectedTable.toLowerCase().includes('take-away');
            const orderPayload = {
                restaurant_id: restaurantId,
                total,
                status: 'pending', // Cai diretamente na Fila da Cozinha (KDS)!
                order_type: isTakeawayOrder ? 'takeaway' : 'dine-in',
                customer_name: customerName.trim() || `Cliente (${selectedTable})`,
                table_number: isTakeawayOrder
                    ? `Takeaway / Recolha no Balcão | Garçom: ${activeStaff?.name || 'Balcão'}`
                    : `${selectedTable} | Garçom: ${activeStaff?.name || 'Sala'}`,
                items: itemsWithNotes,
                staff_member_name: activeStaff?.name || 'Garçom'
            };

            await orderService.createOrder(orderPayload);
            toast.success(`🍳 Comanda da ${selectedTable} enviada diretamente para a Cozinha!`);
            setCart([]);
            setOrderNotes('');
            setCustomerName('');
            setWaiterTab('passes_mesas');
            fetchActiveOrders();
        } catch (err) {
            toast.error('Erro ao enviar comanda: ' + (err.message || ''));
        } finally {
            setSubmittingOrder(false);
        }
    };

    // Filtered Orders by Stage
    const pendingOrders = orders.filter(o => ['pending', 'pendente', 'waiting_payment'].includes(String(o.status || '').toLowerCase().trim()));
    const preparingOrders = orders.filter(o => ['preparing', 'preparando'].includes(String(o.status || '').toLowerCase().trim()));
    const readyOrders = orders.filter(o => ['ready', 'pronto'].includes(String(o.status || '').toLowerCase().trim()));
    const activeTableOrders = orders.filter(o => !['cancelled', 'cancelado', 'completed', 'delivered', 'entregue'].includes(String(o.status || '').toLowerCase().trim()));

    const getElapsedMinutes = (createdAt) => {
        if (!createdAt) return 'Agora';
        const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
        if (mins < 60) return `${mins} min`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m`;
    };

    const getCleanTableName = (rawTable = '') => {
        return String(rawTable || 'Mesa').split('|')[0].trim();
    };

    const getOrderModalityInfo = (ord) => {
        const rawTable = String(ord?.table_number || '');
        const isDeliv = ord?.order_type === 'delivery' || rawTable.includes('Entrega:');
        const isTake = !isDeliv && (ord?.order_type === 'takeaway' || rawTable.toLowerCase().includes('takeaway') || rawTable.toLowerCase().includes('recolha'));
        const pin = String(ord?.id || '').slice(0, 4).toUpperCase();
        if (isDeliv) {
            return {
                type: 'delivery',
                badge: `🛵 DELIVERY (#${pin})`,
                kitchenInstruction: '📦 EMBALAR P/ ESTAFETA (ENTREGA FORA)',
                badgeClass: 'bg-blue-500 text-white',
                pin
            };
        }
        if (isTake) {
            return {
                type: 'takeaway',
                badge: `🛍️ TAKE-AWAY (SENHA #${pin})`,
                kitchenInstruction: '🛍️ EMBALAR P/ VIAGEM (CLIENTE LEVANTA NO BALCÃO)',
                badgeClass: 'bg-purple-500 text-white',
                pin
            };
        }
        return {
            type: 'dine-in',
            badge: `🍽️ ${getCleanTableName(ord?.table_number)}`,
            kitchenInstruction: '🍽️ SERVIR NA MESA (DENTRO DO RESTAURANTE)',
            badgeClass: 'bg-amber-400 text-black',
            pin
        };
    };

    // ========================================================================
    // 1. TERMINAL EXCLUSIVO DA COZINHA — KDS PURO (Chef / Cozinha)
    // ========================================================================
    if (normalizedRole === 'kitchen') {
        return (
            <div className="min-h-screen bg-[#09090B] text-white font-sans flex flex-col">
                {/* Top Header KDS Puro — Sem Menus de Administrador */}
                <header className="bg-[#121215] border-b border-amber-500/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
                            <ChefHat size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black">
                                    👨‍🍳 ECRÃ DE COZINHA (KDS)
                                </span>
                                <span className="text-xs font-mono text-gray-400">
                                    {currentTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-serif font-black text-white mt-0.5">
                                {restaurantName} — <span className="text-[#D4AF37]">Chef: {activeStaff?.name}</span>
                            </h1>
                        </div>
                    </div>

                    {/* Contadores Gigantes de Produção */}
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                            <span className="text-xs text-amber-300 font-bold uppercase">1. Na Fila:</span>
                            <span className="text-xl font-mono font-black text-amber-400">{pendingOrders.length}</span>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2">
                            <span className="text-xs text-cyan-300 font-bold uppercase">2. No Fogo:</span>
                            <span className="text-xl font-mono font-black text-cyan-400">{preparingOrders.length}</span>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                            <span className="text-xs text-emerald-300 font-bold uppercase">3. No Passe:</span>
                            <span className="text-xl font-mono font-black text-emerald-400">{readyOrders.length}</span>
                        </div>
                    </div>

                    {/* Controlos do Chef */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setAudioEnabled(!audioEnabled)}
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                                audioEnabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400'
                            }`}
                        >
                            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            <span>Som {audioEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                        <button
                            onClick={onSwitchOperator}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                            <Users size={15} /> Trocar Operador
                        </button>
                        <button
                            onClick={onExitStaffMode}
                            className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-1.5 cursor-pointer"
                        >
                            <LogOut size={15} /> Sair do Turno
                        </button>
                    </div>
                </header>

                {/* Quadro KDS de Cozinha (Apenas Produção Culinária — Sem Preços nem Faturas!) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-y-auto">
                    {/* COLUNA 1: NOVOS PEDIDOS A FAZER */}
                    <div className="bg-[#121215] border-2 border-amber-500/30 rounded-3xl p-5 flex flex-col">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
                                <h2 className="text-lg font-serif font-black text-amber-400 uppercase tracking-wider">
                                    1. Novos Pedidos — A Iniciar ({pendingOrders.length})
                                </h2>
                            </div>
                            <span className="text-xs text-gray-400">Enviados pelo Menu QR ou Garçom</span>
                        </div>

                        {pendingOrders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500">
                                <Utensils size={48} className="mb-3 opacity-30" />
                                <p className="text-sm font-bold">Nenhum pedido pendente na fila.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pendingOrders.map(ord => (
                                    <div key={ord.id} className="bg-[#1A1A1E] border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                                        <div>
                                            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                                                <span className={`text-sm font-black px-3 py-1 rounded-xl ${getOrderModalityInfo(ord).badgeClass}`}>
                                                    {getOrderModalityInfo(ord).badge}
                                                </span>
                                                <span className="text-xs font-mono text-amber-300 flex items-center gap-1">
                                                    <Clock size={13} /> {getElapsedMinutes(ord.created_at)}
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-amber-300">
                                                    {getOrderModalityInfo(ord).kitchenInstruction}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">
                                                Cliente: <strong className="text-white">{ord.customer_name || 'Mesa'}</strong>
                                            </p>
                                            <div className="space-y-2 mb-4">
                                                {(ord.items || []).map((item, idx) => (
                                                    <div key={idx} className="bg-black/50 border border-white/10 rounded-xl p-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-sm">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className="font-bold text-white text-sm">{item.name}</span>
                                                        </div>
                                                        {item.notes && (
                                                            <p className="mt-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                                                                ⚠️ Obs: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleUpdateOrderStatus(ord.id, 'preparing', `🔥 ${getCleanTableName(ord.table_number)} em preparação na cozinha!`)}
                                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Flame size={16} /> Iniciar Preparo (Colocar no Fogo)
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUNA 2: EM PREPARAÇÃO NA GRELHA / FOGÃO */}
                    <div className="bg-[#121215] border-2 border-cyan-500/30 rounded-3xl p-5 flex flex-col">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <Flame size={20} className="text-cyan-400 animate-bounce" />
                                <h2 className="text-lg font-serif font-black text-cyan-400 uppercase tracking-wider">
                                    2. Em Preparação no Fogo ({preparingOrders.length})
                                </h2>
                            </div>
                            <span className="text-xs text-gray-400">Clique em "Prato Pronto" para chamar o Garçom</span>
                        </div>

                        {preparingOrders.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500">
                                <ChefHat size={48} className="mb-3 opacity-30" />
                                <p className="text-sm font-bold">Nenhum prato em preparação neste momento.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {preparingOrders.map(ord => (
                                    <div key={ord.id} className="bg-[#1A1A1E] border-2 border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                                        <div>
                                            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                                                <span className={`text-sm font-black px-3 py-1 rounded-xl ${getOrderModalityInfo(ord).badgeClass}`}>
                                                    {getOrderModalityInfo(ord).badge}
                                                </span>
                                                <span className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                                                    <Clock size={13} /> {getElapsedMinutes(ord.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-3">
                                                Cliente: <strong className="text-white">{ord.customer_name || 'Mesa'}</strong>
                                            </p>
                                            <div className="space-y-2 mb-4">
                                                {(ord.items || []).map((item, idx) => (
                                                    <div key={idx} className="bg-black/50 border border-white/10 rounded-xl p-2.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-black text-sm">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className="font-bold text-white text-sm">{item.name}</span>
                                                        </div>
                                                        {item.notes && (
                                                            <p className="mt-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                                                                ⚠️ Obs: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleUpdateOrderStatus(ord.id, 'ready', `🔔 Prato da ${getCleanTableName(ord.table_number)} PRONTO! O Garçom foi notificado.`)}
                                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Bell size={16} /> Prato Pronto! (Chamar Garçom)
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 2. TERMINAL EXCLUSIVO DE CAIXA POS (`role === 'reception'`)
    // ========================================================================
    if (normalizedRole === 'reception') {
        return (
            <div className="min-h-screen bg-[#0B0B0D] text-white font-sans flex flex-col">
                <header className="bg-[#141417] border-b border-[#D4AF37]/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                            <CreditCard size={22} />
                        </div>
                        <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#D4AF37] text-black">
                                💵 TERMINAL DE CAIXA &amp; POS BALCÃO
                            </span>
                            <h1 className="text-lg sm:text-xl font-serif font-black text-white mt-0.5">
                                {restaurantName} — <span className="text-[#D4AF37]">Operador(a): {activeStaff?.name}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={onSwitchOperator}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                            <Users size={15} /> Trocar Operador
                        </button>
                        <button
                            onClick={onExitStaffMode}
                            className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-1.5 cursor-pointer"
                        >
                            <LogOut size={15} /> Sair do Turno
                        </button>
                    </div>
                </header>
                <div className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
                    <InvoicesManager
                        restaurantId={restaurantId}
                        restaurantName={restaurantName}
                        businessSector="restaurant"
                        activeStaff={activeStaff}
                    />
                </div>
            </div>
        );
    }

    // ========================================================================
    // 3. TERMINAL EXCLUSIVO DO GARÇOM / SALA (`role === 'waiter'`)
    //    Padrão Mundial Toast Go / Square Handheld / Lightspeed Waiter:
    //    - Sem barra lateral do Gerente!
    //    - Vê Pratos Prontos na Cozinha para levar à Mesa;
    //    - Vê o estado das Mesas (mas NÃO mexe nos botões internos do Chef da Cozinha!);
    //    - Lança Novos Pedidos de Mesa diretamente para a Cozinha;
    //    - Emite a Conta/Fatura da Mesa quando o cliente pede a conta!
    // ========================================================================
    return (
        <div className="min-h-screen bg-[#0B0B0D] text-white font-sans flex flex-col">
            {/* Cabeçalho Exclusivo do Garçom */}
            <header className="bg-[#141417] border-b border-[#D4AF37]/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl sticky top-0 z-30">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center overflow-hidden">
                        <img
                            src={getAssetPath('/jindungo_logo_v3.png')}
                            alt="Jindungo"
                            className="w-10 h-10 object-contain"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#D4AF37] text-black">
                                🤵 TERMINAL DO GARÇOM &amp; SALA
                            </span>
                            <span className="text-xs font-mono text-emerald-400 font-bold">
                                ● Em Turno: {activeStaff?.name}
                            </span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-serif font-black text-white mt-0.5">
                            {restaurantName} — Atendimento de Mesas &amp; Pedidos QR
                        </h1>
                    </div>
                </div>

                {/* Navegação Principal do Garçom (3 Botões Grandes de Sala) */}
                <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setWaiterTab('passes_mesas')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            waiterTab === 'passes_mesas'
                                ? 'bg-[#D4AF37] text-black shadow-lg'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        <Bell size={15} />
                        <span>1. Passe da Cozinha &amp; Mesas</span>
                        {readyOrders.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black animate-bounce">
                                {readyOrders.length} Pronto!
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setWaiterTab('novo_pedido')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            waiterTab === 'novo_pedido'
                                ? 'bg-[#D4AF37] text-black shadow-lg'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        <Plus size={15} />
                        <span>2. Anotar Pedido p/ Cozinha</span>
                    </button>

                    <button
                        onClick={() => setWaiterTab('contas')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                            waiterTab === 'contas'
                                ? 'bg-[#D4AF37] text-black shadow-lg'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        <Receipt size={15} />
                        <span>3. Fechar Conta / Recibo</span>
                    </button>
                </div>

                {/* Botões de Sessão */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSwitchOperator}
                        className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                        <Users size={14} /> Trocar PIN
                    </button>
                    <button
                        onClick={onExitStaffMode}
                        className="px-3.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-1.5 cursor-pointer"
                        title="Sair do Modo Garçom"
                    >
                        <LogOut size={14} /> Sair
                    </button>
                </div>
            </header>

            {/* CORPO DO TERMINAL DO GARÇOM */}
            <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
                {/* ALERTA DE CHAMADA DE MESA PELO QR CODE */}
                {waiterCalls.length > 0 && (
                    <div className="bg-red-950/40 border-2 border-red-500 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-500 text-black flex items-center justify-center font-black">
                                <Bell size={22} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                    🔔 Chamada de Cliente na Mesa (Menu QR)!
                                </h3>
                                <p className="text-xs text-red-200">
                                    Mesas a solicitar presença do garçom: {waiterCalls.map(c => `Mesa ${c.mesa_id}`).join(', ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {waiterCalls.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleResolveWaiterCall(c.id, c.mesa_id)}
                                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black font-black text-xs uppercase cursor-pointer"
                                >
                                    ✓ Atendi Mesa {c.mesa_id}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA 1: PASSE DA COZINHA & ESTADO DAS MESAS */}
                {waiterTab === 'passes_mesas' && (
                    <div className="space-y-8">
                        {/* SECÇÃO A: PRATOS PRONTOS NO PASSE DA COZINHA PARA O GARÇOM LEVAR À MESA */}
                        <div className="bg-gradient-to-br from-emerald-950/40 via-[#121615] to-[#121214] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-center justify-between pb-4 mb-5 border-b border-emerald-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-lg">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-serif font-black text-white flex items-center gap-2">
                                            <span>Prontos no Passe da Cozinha — Levar à Mesa!</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500 text-black">
                                                {readyOrders.length}
                                            </span>
                                        </h2>
                                        <p className="text-xs text-emerald-300/80">
                                            Estes pratos já foram finalizados pelo Chef na cozinha. Recolha no balcão da cozinha e entregue na mesa indicada.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {readyOrders.length === 0 ? (
                                <div className="py-10 text-center text-gray-400 text-xs">
                                    Nenhum prato aguarda recolha no passe da cozinha neste momento.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {readyOrders.map(ord => {
                                        const mod = getOrderModalityInfo(ord);
                                        return (
                                            <div key={ord.id} className="bg-[#161F1C] border-2 border-emerald-500 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`px-3 py-1 rounded-xl font-black text-xs uppercase ${mod.badgeClass}`}>
                                                            {mod.badge}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                                                            {mod.type === 'takeaway' ? '🛍️ PRONTO P/ RECOLHA' : mod.type === 'delivery' ? '🛵 PRONTO P/ ESTAFETA' : '🔔 PRONTO P/ MESA'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-300 mb-3">
                                                        Cliente: <strong className="text-white">{ord.customer_name || 'Cliente'}</strong>
                                                    </p>
                                                    <div className="space-y-1.5 mb-4 bg-black/40 p-3 rounded-xl border border-white/10">
                                                        {(ord.items || []).map((it, idx) => (
                                                            <div key={idx} className="text-xs flex items-center justify-between text-white font-bold">
                                                                <span>{it.quantity}x {it.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {mod.type === 'delivery' ? (
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(ord.id, 'out_for_delivery', `🛵 Encomenda #${mod.pin} despachada com Estafeta!`)}
                                                            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                                        >
                                                            <CheckCircle2 size={16} /> 🛵 Despachar Estafeta (Em Rota)
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const url = `${window.location.origin}/motoboy/${ord.id}`;
                                                                navigator.clipboard.writeText(url);
                                                                toast.success('📲 Link GPS do Estafeta copiado! Envie ao motorista.');
                                                            }}
                                                            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            📲 Copiar Link GPS do Motoboy
                                                        </button>
                                                    </div>
                                                ) : mod.type === 'takeaway' ? (
                                                    <button
                                                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', `🛍️ Take-Away (Senha #${mod.pin}) entregue ao cliente no balcão!`)}
                                                        className="w-full py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <CheckCircle2 size={16} /> 🛍️ Entregar Take-Away (Senha #{mod.pin})
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered', `🍽️ Pedido entregue na ${getCleanTableName(ord.table_number)}!`)}
                                                        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <CheckCircle2 size={16} /> Marcar como Entregue na Mesa
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* SECÇÃO B: MONITORIZAÇÃO DOS PEDIDOS QUE ESTÃO NA COZINHA (CONSULTA DO GARÇOM) */}
                        <div className="bg-[#141417] border border-white/10 rounded-3xl p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-white/10">
                                <div>
                                    <h3 className="text-base font-serif font-black text-white flex items-center gap-2">
                                        <ChefHat size={18} className="text-[#D4AF37]" />
                                        <span>Pedidos das Mesas em Processamento na Cozinha (Consulta de Sala)</span>
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Veja em tempo real se o pedido que o cliente fez pelo QR Code ou consigo está na fila ou já está no fogo (o controlo de preparo é exclusivo do Chef na Cozinha).
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono">
                                    <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        ⏳ Na Fila: {pendingOrders.length}
                                    </span>
                                    <span className="px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                        🔥 No Fogo: {preparingOrders.length}
                                    </span>
                                </div>
                            </div>

                            {pendingOrders.length === 0 && preparingOrders.length === 0 ? (
                                <div className="py-10 text-center text-gray-500 text-xs">
                                    Não há pedidos em fila ou em confeção na cozinha neste momento.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[...preparingOrders, ...pendingOrders].map(ord => {
                                        const isCooking = ['preparing', 'preparando'].includes(String(ord.status || '').toLowerCase());
                                        return (
                                            <div key={ord.id} className="bg-[#1A1A1E] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2.5">
                                                        <span className="font-black text-sm text-[#D4AF37]">
                                                            {getCleanTableName(ord.table_number)}
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            isCooking
                                                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                        }`}>
                                                            {isCooking ? '🔥 Chef a Cozinhar' : '⏳ Enviado à Cozinha'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-2">
                                                        Cliente: <strong className="text-gray-200">{ord.customer_name}</strong> • Há {getElapsedMinutes(ord.created_at)}
                                                    </p>
                                                    <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                                        {(ord.items || []).map((it, idx) => (
                                                            <div key={idx} className="text-xs text-gray-200 flex justify-between">
                                                                <span>{it.quantity}x {it.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                                                    <span>Total da Comanda: <strong className="text-[#D4AF37] font-mono">{Number(ord.total || 0).toLocaleString('pt-AO')} Kz</strong></span>
                                                    <button
                                                        onClick={() => setSelectedReceiptOrder(ord)}
                                                        className="text-[#D4AF37] hover:underline font-bold cursor-pointer"
                                                    >
                                                        Ver Talão
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA 2: ANOTAR NOVO PEDIDO DE MESA & ENVIAR PARA A COZINHA */}
                {waiterTab === 'novo_pedido' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Catálogo de Pratos e Bebidas (Esquerda 7 cols) */}
                        <div className="lg:col-span-7 bg-[#141417] border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                                    <input
                                        type="text"
                                        value={searchDish}
                                        onChange={e => setSearchDish(e.target.value)}
                                        placeholder="Pesquisar prato, grelhado, bebida..."
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
                                {menuCatalog
                                    .filter(item => {
                                        if (!searchDish) return true;
                                        return (item.name || '').toLowerCase().includes(searchDish.toLowerCase());
                                    })
                                    .map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => addToWaiterCart(item)}
                                            className="p-3.5 rounded-2xl bg-[#1C1C21] border border-white/10 hover:border-[#D4AF37] flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{item.name}</p>
                                                <p className="text-[11px] font-mono text-[#D4AF37] font-bold mt-0.5">
                                                    {Number(item.price || 0).toLocaleString('pt-AO')} Kz
                                                </p>
                                            </div>
                                            <span className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-black shrink-0">
                                                + Anotar
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Comanda da Mesa (Direita 5 cols) */}
                        <div className="lg:col-span-5 bg-[#141417] border border-[#D4AF37]/30 rounded-3xl p-5 flex flex-col justify-between gap-4">
                            <div className="space-y-4">
                                <h3 className="text-base font-serif font-black text-white border-b border-white/10 pb-2.5 flex items-center justify-between">
                                    <span>📝 Comanda de Mesa</span>
                                    <span className="text-xs font-mono text-[#D4AF37]">{cart.length} itens</span>
                                </h3>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Selecionar Mesa</label>
                                        <select
                                            value={selectedTable}
                                            onChange={e => setSelectedTable(e.target.value)}
                                            className="w-full bg-black/60 border border-[#D4AF37]/40 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none"
                                        >
                                            {TABLES_LIST.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nome do Cliente (Opcional)</label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder="Ex: Sr. João"
                                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                </div>

                                {/* Lista de Itens na Comanda */}
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {cart.length === 0 ? (
                                        <p className="text-center py-8 text-xs text-gray-500">
                                            Toque nos pratos ou bebidas ao lado para anotar o pedido da {selectedTable}.
                                        </p>
                                    ) : (
                                        cart.map(item => (
                                            <div key={item.id} className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-white truncate">{item.name}</p>
                                                    <span className="text-[10px] font-mono text-[#D4AF37]">
                                                        {(item.price * item.quantity).toLocaleString('pt-AO')} Kz
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => updateCartQty(item.id, -1)} className="p-1 rounded-lg bg-white/10 text-white cursor-pointer"><Minus size={12} /></button>
                                                    <span className="font-mono font-bold px-1.5">{item.quantity}</span>
                                                    <button onClick={() => updateCartQty(item.id, 1)} className="p-1 rounded-lg bg-white/10 text-white cursor-pointer"><Plus size={12} /></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                                        Observações para o Chef na Cozinha
                                    </label>
                                    <input
                                        type="text"
                                        value={orderNotes}
                                        onChange={e => setOrderNotes(e.target.value)}
                                        placeholder="Ex: Sem cebola, ponto bem passado, trazer bebida já..."
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Total da Comanda:</span>
                                    <span className="text-xl font-serif font-black text-[#D4AF37] font-mono">
                                        {cart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('pt-AO')} Kz
                                    </span>
                                </div>
                                <button
                                    onClick={handleSendWaiterOrderToKitchen}
                                    disabled={submittingOrder || cart.length === 0}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 cursor-pointer"
                                >
                                    {submittingOrder ? 'A enviar para a Cozinha...' : `🍳 Enviar Pedido da ${selectedTable} para a Cozinha`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 3: FECHAR CONTA / IMPRIMIR TALÃO DE CONFERÊNCIA OU FATURA */}
                {waiterTab === 'contas' && (
                    <div className="bg-[#141417] border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                                <h3 className="text-lg font-serif font-black text-white">
                                    🧾 Contas de Mesas &amp; Emissão de Talão
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Imprima a Consulta de Mesa / Fatura 80mm para apresentar ao cliente e fechar a mesa.
                                </p>
                            </div>
                        </div>

                        {orders.length === 0 ? (
                            <p className="py-12 text-center text-xs text-gray-500">Nenhum pedido registado hoje.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {orders.slice(0, 18).map(ord => (
                                    <div key={ord.id} className="p-4 rounded-2xl bg-[#1A1A1E] border border-white/10 flex flex-col justify-between gap-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-black text-[#D4AF37]">
                                                    {getCleanTableName(ord.table_number)}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-white">
                                                    {Number(ord.total || 0).toLocaleString('pt-AO')} Kz
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">
                                                Cliente: <strong className="text-white">{ord.customer_name || 'Consumidor Final'}</strong>
                                            </p>
                                            <div className="text-[11px] text-gray-300 space-y-0.5 bg-black/40 p-2.5 rounded-xl">
                                                {(ord.items || []).map((it, idx) => (
                                                    <div key={idx}>{it.quantity}x {it.name}</div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <button
                                                onClick={() => setSelectedReceiptOrder(ord)}
                                                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:brightness-110 text-black font-black text-xs uppercase cursor-pointer"
                                            >
                                                🧾 Talão / Fatura
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {selectedReceiptOrder && (
                <ReceiptModal
                    isOpen={!!selectedReceiptOrder}
                    onClose={() => setSelectedReceiptOrder(null)}
                    order={selectedReceiptOrder}
                    restaurantName={restaurantName}
                    businessSector="restaurant"
                />
            )}
        </div>
    );
};

export default StaffTerminalView;

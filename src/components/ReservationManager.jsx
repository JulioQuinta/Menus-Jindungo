import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Users, Phone, Clock, CheckCircle, XCircle, Filter, Search, MoreVertical, ChevronRight, User, Sparkles, Plus, Minus, Trash2, Utensils, RefreshCw, UserPlus, Receipt, CheckCheck, Settings2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const MOCK_PERIOD_DATA = [
    { time: 'Seg', casal: 5, grupo: 2 },
    { time: 'Ter', casal: 8, grupo: 3 },
    { time: 'Qua', casal: 12, grupo: 8 },
    { time: 'Qui', casal: 25, grupo: 18 },
    { time: 'Sex', casal: 45, grupo: 32 },
    { time: 'Sáb', casal: 68, grupo: 45, peak: true },
    { time: 'Dom', casal: 30, grupo: 20 },
];

const MOCK_MIX_DATA = [
    { name: 'Jantar Casal', value: 25, color: '#D4AF37' },
    { name: 'Almoço de Grupo', value: 38, color: '#3B82F6' },
    { name: 'Evento Corporativo', value: 23.9, color: '#8E8E93' },
    { name: 'Aniversários / Festas', value: 13.1, color: '#D4AF37' },
];

const ReservationManager = ({ restaurantId, restaurantName }) => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
    const [searchQuery, setSearchQuery] = useState('');
    const [tableMap, setTableMap] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(null); // stores reservation being assigned
    const [showRejectModal, setShowRejectModal] = useState(null); // stores reservation being rejected
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedTables, setSelectedTables] = useState([]);
    const [occupiedTables, setOccupiedTables] = useState([]);
    const [periodTab, setPeriodTab] = useState('Dia'); // Dia, Semana, Mês
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(null);

    // Estados do Mapa de Mesas Interativo
    const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' ou 'tables'
    const [activeOrders, setActiveOrders] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [selectedTableDetails, setSelectedTableDetails] = useState(null);
    const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
    const [quickCart, setQuickCart] = useState([]);
    const [customerNameInput, setCustomerNameInput] = useState('Consumidor Final');
    const [quickSearchQuery, setQuickSearchQuery] = useState('');

    const fetchActiveOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .in('status', ['pending', 'preparing', 'ready', 'pendente', 'preparando', 'pronto']);
            if (error) throw error;
            setActiveOrders(data || []);
        } catch (error) {
            console.error('Error fetching active orders:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('available', true)
                .order('name');
            if (error) throw error;
            setProductsList(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        if (restaurantId) {
            fetchReservations();
            fetchTableMap();
            fetchActiveOrders();
            fetchProducts();

            const subscription = supabase
                .channel('reservations-admin')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurantId}`
                }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Play alert sound for new reservation
                        try {
                            const audio = new Audio('/bell.mp3');
                            audio.volume = 0.5;
                            audio.play().catch(e => console.log('Autoplay audio blocked by browser settings', e));
                            toast.success("🛎️ Nova solicitação de reserva recebida!");
                        } catch (e) {}
                    }
                    fetchReservations();
                })
                .subscribe();

            // Realtime subscription for active orders to keep the map updated
            const ordersSubscription = supabase
                .channel('active-orders-map')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`
                }, () => {
                    fetchActiveOrders();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
                supabase.removeChannel(ordersSubscription);
            };
        }
    }, [restaurantId]);

    const fetchReservations = async () => {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('reservation_date', { ascending: false })
                .order('reservation_time', { ascending: false });

            if (error) throw error;
            setReservations(data || []);
        } catch (error) {
            console.error('Error fetching reservations:', error);
            toast.error("Erro ao carregar reservas");
        } finally {
            setLoading(false);
        }
    };

    const fetchTableMap = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('table_map')
                .eq('id', restaurantId)
                .single();

            if (error) throw error;
            setTableMap(data?.table_map || []);
        } catch (error) {
            console.error('Error fetching table map:', error);
        }
    };

    const fetchOccupiedTables = async (date) => {
        try {
            const { data, error } = await supabase
                .from('reservations')
                .select('assigned_tables')
                .eq('restaurant_id', restaurantId)
                .eq('reservation_date', date)
                .eq('status', 'confirmed');

            if (error) throw error;
            const taken = data.flatMap(r => r.assigned_tables || []);
            setOccupiedTables(taken);
        } catch (error) {
            console.error('Error fetching occupied tables:', error);
        }
    };

    // Helper to generate WhatsApp pre-filled message url and text
    const generateWhatsAppMessage = (res, newStatus, reason = null, tables = []) => {
        const formattedDate = new Date(res.reservation_date).toLocaleDateString('pt-PT');
        const formattedTime = res.reservation_time.slice(0, 5);
        const peopleText = res.num_people === 1 ? '1 pessoa' : `${res.num_people} pessoas`;
        const restName = restaurantName || 'Jindungo';

        let msg = "";
        if (newStatus === 'confirmed') {
            const tablesText = tables.length > 0 ? tables.join(', ') : 'A definir na chegada';
            msg = `Olá *${res.customer_name}*! 🌟\n\nConfirmamos com sucesso a sua reserva no *${restName}*! 🍳✨\n\n📅 *Data:* ${formattedDate}\n⏰ *Hora:* ${formattedTime}\n👥 *Lugar:* ${peopleText}\n📍 *Mesa(s) Atribuída(s):* ${tablesText}\n\nEstamos ansiosos por recebê-lo(a) para uma experiência única! 🌶️🇦🇴`;
        } else {
            const reasonText = reason || 'Pedimos desculpa, mas o restaurante encontra-se sem disponibilidade.';
            msg = `Olá *${res.customer_name}*.\n\nLamentamos informar, mas a sua solicitação de reserva no *${restName}* para o dia *${formattedDate}* às *${formattedTime}* não pôde ser confirmada.\n\n❌ *Motivo:* ${reasonText}\n\nSe desejar, pode sugerir um novo horário ou entrar em contacto connosco. Agradecemos a compreensão. 🙏`;
        }

        const cleanPhone = String(res.customer_phone).replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(msg);
        const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

        return {
            messageText: msg,
            whatsappUrl: url
        };
    };

    const updateStatus = async (id, newStatus, reason = null, tables = []) => {
        try {
            const updateData = { status: newStatus };
            if (reason) updateData.rejection_reason = reason;
            if (tables.length > 0) updateData.assigned_tables = tables;

            const { error } = await supabase
                .from('reservations')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            const message = newStatus === 'confirmed' ? 'Reserva confirmada!' : 'Reserva rejeitada.';
            toast.success(message);

            // Fetch reservation details from our state to pop up the WhatsApp Modal
            const res = reservations.find(r => r.id === id);
            if (res) {
                const { messageText, whatsappUrl } = generateWhatsAppMessage(res, newStatus, reason, tables);
                setShowWhatsAppModal({
                    customerName: res.customer_name,
                    customerPhone: res.customer_phone,
                    status: newStatus,
                    messageText,
                    whatsappUrl
                });
            }

            setShowAssignModal(null);
            setSelectedTables([]);
            fetchReservations();
        } catch (error) {
            console.error('Error updating reservation:', error);
            toast.error("Erro ao atualizar reserva");
        }
    };

    const handleConfirmRequest = async (res) => {
        await fetchOccupiedTables(res.reservation_date);
        setShowAssignModal(res);
        setSelectedTables(res.assigned_tables || []);
    };

    const handleRejectClick = (res) => {
        setShowRejectModal(res);
        setRejectionReason('');
    };

    const confirmReject = () => {
        if (!rejectionReason.trim()) return toast.error("Por favor, insira um motivo.");
        updateStatus(showRejectModal.id, 'cancelled', rejectionReason);
        setShowRejectModal(null);
    };

    const handleTableClick = (tableName, order, reservation) => {
        setSelectedTableDetails({
            name: tableName,
            order: order,
            reservation: reservation
        });
        if (order) {
            setQuickCart(order.items || []);
            setCustomerNameInput(order.customer_name || 'Consumidor Final');
        } else {
            setQuickCart([]);
            setCustomerNameInput('Consumidor Final');
        }
        setQuickSearchQuery('');
        setShowQuickOrderModal(true);
    };

    const handleAddToQuickCart = (product) => {
        setQuickCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
            }
        });
    };

    const handleUpdateQuantity = (productId, amount) => {
        setQuickCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + amount;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const handleRemoveFromQuickCart = (productId) => {
        setQuickCart(prev => prev.filter(item => item.id !== productId));
    };

    const handleStartTableOrder = async () => {
        if (quickCart.length === 0) {
            toast.error("Adicione pelo menos um artigo para iniciar o consumo.");
            return;
        }
        const newTotal = quickCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderData = {
            restaurant_id: restaurantId,
            table_number: selectedTableDetails.name,
            customer_name: customerNameInput || 'Consumidor Final',
            customer_nif: '999999999',
            items: quickCart,
            total: newTotal,
            status: 'pending',
            payment_method: 'Numerário',
            order_type: 'table',
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('orders')
                .insert([orderData]);
            if (error) throw error;
            toast.success(`Consumo iniciado para a ${selectedTableDetails.name}!`);
            setShowQuickOrderModal(false);
            fetchActiveOrders();
        } catch (err) {
            console.error(err);
            toast.error("Erro ao iniciar consumo.");
        }
    };

    const handleUpdateTableOrder = async () => {
        if (!selectedTableDetails?.order?.id) return;
        
        if (quickCart.length === 0) {
            const confirmClose = window.confirm("O consumo está vazio. Pretende libertar esta mesa?");
            if (confirmClose) {
                handleCloseTableOrder();
            }
            return;
        }

        const newTotal = quickCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    items: quickCart,
                    total: newTotal,
                    customer_name: customerNameInput
                })
                .eq('id', selectedTableDetails.order.id);

            if (error) throw error;
            toast.success("Consumo da mesa updated!");
            setShowQuickOrderModal(false);
            fetchActiveOrders();
        } catch (err) {
            console.error(err);
            toast.error("Erro ao atualizar mesa.");
        }
    };

    const handleCloseTableOrder = async () => {
        if (!selectedTableDetails?.order?.id) return;
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'paid'
                })
                .eq('id', selectedTableDetails.order.id);

            if (error) throw error;
            toast.success("Mesa libertada e conta fechada com sucesso!");
            setShowQuickOrderModal(false);
            fetchActiveOrders();
        } catch (err) {
            console.error(err);
            toast.error("Erro ao fechar mesa.");
        }
    };

    const handlePrintPreInvoice = async () => {
        const order = selectedTableDetails?.order;
        if (!order) return;

        const dateStr = new Date(order.created_at).toLocaleString();
        const itemsHtml = quickCart.map(item => `
            <tr>
                <td style="padding: 5px 0;">${item.name} x${item.quantity}</td>
                <td style="text-align: right; padding: 5px 0;">${(item.price * item.quantity).toLocaleString()} Kz</td>
            </tr>
        `).join('');

        const receiptHtml = `
            <html>
                <body style="font-family: monospace; font-size: 12px; max-width: 280px; margin: auto; padding: 10px; color: #000;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <h2 style="margin: 0; font-size: 16px;">${restaurantName || 'Menus Jindungo'}</h2>
                        <p style="margin: 2px 0;">CONSULTE O SEU CONSUMO</p>
                        <p style="margin: 2px 0;">(NÃO SERVE COMO DOCUMENTO FISCAL)</p>
                    </div>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <p style="margin: 2px 0;"><b>Mesa:</b> ${selectedTableDetails.name}</p>
                    <p style="margin: 2px 0;"><b>Cliente:</b> ${customerNameInput}</p>
                    <p style="margin: 2px 0;"><b>Data:</b> ${dateStr}</p>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #000;">
                                <th style="text-align: left; padding-bottom: 5px;">Artigo</th>
                                <th style="text-align: right; padding-bottom: 5px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <div style="font-size: 14px; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>TOTAL GERAL:</span>
                        <span>${quickCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} Kz</span>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="margin: 0;">Obrigado e volte sempre!</p>
                    </div>
                </body>
            </html>
        `;

        if (window.electronAPI && typeof window.electronAPI.printReceipt === 'function') {
            try {
                await window.electronAPI.printReceipt(receiptHtml);
                toast.success("Consulta de consumo (pré-fatura) impressa com sucesso!", { icon: '🖨️' });
            } catch (err) {
                console.error("Erro na impressão silenciosa da pré-fatura:", err);
                toast.error("Erro ao imprimir pré-fatura.");
            }
        } else {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const filteredReservations = reservations.filter(res => {
        const matchesFilter = filter === 'all' || res.status === filter;
        const matchesSearch = (res.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.customer_phone || '').includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-950/40 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
            case 'cancelled': return 'bg-red-950/40 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
            case 'completed': return 'bg-blue-950/40 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            default: return 'bg-amber-950/40 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,197,66,0.2)]';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmada';
            case 'cancelled': return 'Cancelada';
            case 'completed': return 'Concluída';
            default: return 'Pendente';
        }
    };

    const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
    const pendingCount = reservations.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            
            {/* Outer Tab Bar Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#121213]/95 border border-white/5 p-6 rounded-[2rem] shadow-xl gap-4">
                <div className="flex items-center gap-3">
                    <Calendar className="text-[#D4AF37]" size={24} />
                    <div>
                        <h2 className="font-serif font-black text-white text-lg sm:text-xl">Salão & Reservas</h2>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Restaurante: {restaurantName}</p>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex gap-1 self-stretch sm:self-auto">
                    <button
                        onClick={() => setActiveTab('reservations')}
                        className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${activeTab === 'reservations' ? 'bg-[#D4AF37] text-black font-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white bg-transparent'}`}
                    >
                        Reservas
                    </button>
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${activeTab === 'tables' ? 'bg-[#D4AF37] text-black font-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-gray-400 hover:text-white bg-transparent'}`}
                    >
                        Mapa de Mesas
                    </button>
                </div>
            </div>

            {activeTab === 'reservations' && (
                <>
            {/* 3 Top Glowing Dash Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1: Total de Reservas */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">TOTAL DE RESERVAS</p>
                        <p className="text-4xl font-serif font-black text-[#D4AF37] tracking-tight mt-2">{reservations.length}</p>
                    </div>
                </div>

                {/* Card 2: Confirmadas */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)] relative overflow-hidden group hover:border-green-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all duration-700"></div>
                    <div>
                        <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest mb-1">CONFIRMADAS</p>
                        <p className="text-4xl font-serif font-black text-green-500 tracking-tight mt-2">{confirmedCount}</p>
                    </div>
                </div>

                {/* Card 3: Pendentes Hoje */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#121213]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-amber-500/30 shadow-[0_0_40px_rgba(245,197,66,0.15)] relative overflow-hidden group hover:border-amber-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700"></div>
                    <div>
                        <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">PENDENTES HOJE</p>
                        <p className="text-4xl font-serif font-black text-amber-400 tracking-tight mt-2">{pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Search + Filter Pill Bar */}
            <div className="bg-[#121213]/90 backdrop-blur-xl border border-white/5 rounded-full p-2.5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                <div className="relative flex-1 w-full pl-2 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou telemóvel..."
                        className="w-full bg-transparent pl-14 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all font-sans"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5 w-full md:w-auto overflow-x-auto custom-scrollbar">
                    {['all', 'pending', 'confirmed', 'cancelled'].map((f) => {
                        const active = filter === f;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                                    active 
                                        ? 'bg-gradient-to-r from-[#D4AF37] via-[#F9E6A2] to-[#D4AF37] text-black font-black shadow-[0_0_20px_rgba(245,197,66,0.5)] scale-105' 
                                        : 'text-gray-400 hover:text-white font-medium hover:bg-white/5'
                                }`}
                            >
                                {f === 'all' ? 'Todas' : getStatusLabel(f)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Section 1: Reservas por Período */}
                <div className="lg:col-span-5 bg-[#121213]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/30 transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-bold text-lg text-white">Reservas por Período</h3>
                        <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5">
                            {['Dia', 'Semana', 'Mês'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setPeriodTab(t)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                        periodTab === t 
                                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black shadow-[0_0_12px_rgba(245,197,66,0.4)]' 
                                            : 'text-gray-500 hover:text-white font-bold'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_PERIOD_DATA} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="goldResArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="blueResArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#242424" />
                                <XAxis dataKey="time" stroke="#777" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#777" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #D4AF37', borderRadius: '16px', color: '#fff', boxShadow: '0 0 20px rgba(245,197,66,0.3)' }} />
                                <Area type="monotone" dataKey="grupo" stroke="#3B82F6" strokeWidth={2.5} fill="url(#blueResArea)" name="Grupos" />
                                <Area type="monotone" dataKey="casal" stroke="#D4AF37" strokeWidth={3.5} fill="url(#goldResArea)" name="Casais" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Section 2: Mix de Reservas */}
                <div className="lg:col-span-4 bg-[#121213]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/30 transition-all">
                    <h3 className="font-serif font-bold text-lg text-white mb-4">Mix de Reservas</h3>
                    <div className="h-64 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={MOCK_MIX_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {MOCK_MIX_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#121213" strokeWidth={3} className="hover:opacity-80 transition-opacity" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #D4AF37', borderRadius: '16px', color: '#fff' }} formatter={(val) => `${val}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Lotação</span>
                            <span className="text-xl font-serif font-bold text-white">88%</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {MOCK_MIX_DATA.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="truncate">{item.name}</span>
                                <span className="font-bold text-white ml-auto">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 3: Dicas de Tomada de Decisão */}
                <div className="lg:col-span-3 bg-[#121213]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/30 transition-all max-h-[380px] overflow-hidden">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5 shrink-0">
                        <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
                            Dicas IA
                        </h4>
                        <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">AO VIVO</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-[#D4AF37]/40 transition-colors group">
                            <h5 className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">Sugerir Promoção p/ Noites de Sexta</h5>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-light">Sugerir Promoção p/ Noites de Sexta para atrair mais casais entre as 19h e 22h.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-[#D4AF37]/40 transition-colors group">
                            <h5 className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">Rever Staff p/ Picos de Sábado</h5>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-light">Previsão de lotação máxima. Sugerimos reforçar a equipa de sala para garantir atendimento de excelência.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-[#D4AF37]/40 transition-colors group">
                            <h5 className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors mb-1">Sugerir Promoção de Ocasião</h5>
                            <p className="text-[11px] text-gray-400 leading-relaxed font-light">Os almoços de quarta-feira apresentam margem para crescimento através de menus executivos.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table/List */}
            <div className="bg-[#121213]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-2 sm:p-6 shadow-2xl overflow-hidden">
                {loading ? (
                    <div className="p-24 text-center text-gray-500 animate-pulse font-serif text-sm tracking-widest uppercase">Carregando reservas...</div>
                ) : filteredReservations.length > 0 ? (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Data & Hora</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Pessoas / Mesas</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredReservations.map((res) => (
                                    <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group h-20">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-0.5 border border-white/10 shrink-0 overflow-hidden shadow-md flex items-center justify-center group-hover:border-[#D4AF37]/50 transition-colors">
                                                    <div className="w-full h-full rounded-2xl bg-[#0A0A0B] flex items-center justify-center">
                                                        <User size={20} className="text-[#D4AF37]" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-serif font-bold text-white text-base sm:text-lg group-hover:text-[#D4AF37] transition-colors">{res.customer_name}</p>
                                                    <p className="text-gray-500 text-xs font-mono">{res.customer_phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5 text-sm font-medium">
                                                <Calendar size={16} className="text-[#D4AF37]" />
                                                <span className="text-white">{new Date(res.reservation_date).toLocaleDateString()}</span>
                                                <span className="text-gray-500 font-bold ml-1">às {res.reservation_time.slice(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} className="text-[#D4AF37]" />
                                                    <span className="font-bold text-white text-sm sm:text-base">{res.num_people} Pessoas</span>
                                                </div>
                                                <span className="font-medium text-xs text-gray-400 pl-6">
                                                    {res.assigned_tables?.length > 0
                                                        ? `Mesas: ${res.assigned_tables.join(', ')}`
                                                        : `${res.num_tables} Mesas Solicitadas`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${getStatusStyles(res.status)}`}>
                                                {getStatusLabel(res.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                {res.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirmRequest(res)}
                                                            className="p-2.5 hover:bg-green-500/20 text-green-400 bg-green-500/10 rounded-2xl transition-all border border-green-500/30 hover:scale-105 active:scale-95 shadow-md"
                                                            title="Confirmar e Atribuir Mesas"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(res)}
                                                            className="p-2.5 hover:bg-red-500/20 text-red-400 bg-red-500/10 rounded-2xl transition-all border border-red-500/30 hover:scale-105 active:scale-95 shadow-md"
                                                            title="Rejeitar"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {res.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleRejectClick(res)}
                                                        className="px-4 py-2 text-[10px] font-black text-red-400 hover:bg-red-500/20 bg-red-500/10 rounded-2xl border border-red-500/30 transition-all font-mono tracking-wider shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                                                    >
                                                        CANCELAR
                                                    </button>
                                                )}
                                            </div>
                                            {res.rejection_reason && (
                                                <p className="mt-2 text-[10px] text-red-400/80 text-right italic">
                                                    Motivo: {res.rejection_reason}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-24 text-center flex flex-col items-center gap-4">
                        <Calendar className="text-[#D4AF37]/30" size={64} />
                        <p className="text-gray-400 font-serif text-base tracking-widest">Nenhuma reserva encontrada para este filtro.</p>
                    </div>
                )}
            </div>
            </>
            )}

            {/* MAPA DE MESAS TAB */}
            {activeTab === 'tables' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Table Map Legend & Refresh */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121213]/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
                        <div>
                            <h3 className="font-serif font-black text-lg text-white">Mapa de Mesas Interativo</h3>
                            <p className="text-gray-400 text-xs mt-1">
                                Visualização em tempo real da ocupação e consumo das mesas do salão.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3.5">
                            <div className="flex gap-4 text-xs font-bold text-gray-300">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Livre</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Em Consumo</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span> Reservada</span>
                            </div>
                            <button
                                onClick={() => {
                                    fetchTableMap();
                                    fetchActiveOrders();
                                    fetchReservations();
                                    toast.success("Mapa de mesas atualizado!");
                                }}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center"
                                title="Atualizar Estado"
                            >
                                <RefreshCw size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Tables Grid */}
                    {tableMap.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {tableMap.map((tableName) => {
                                const tableOrder = activeOrders.find(o => {
                                    const oTable = String(o.table_number || '').toLowerCase().trim();
                                    const tName = String(tableName).toLowerCase().trim();
                                    return oTable === tName || oTable.includes(tName) || tName.includes(oTable);
                                });

                                const todayStr = new Date().toISOString().split('T')[0];
                                const tableReservation = reservations.find(r => 
                                    r.status === 'confirmed' &&
                                    r.reservation_date === todayStr &&
                                    (r.assigned_tables || []).some(t => String(t).toLowerCase().trim() === String(tableName).toLowerCase().trim())
                                );

                                const isOccupied = !!tableOrder;
                                const isReserved = !!tableReservation;

                                let cardStyle = "border-white/5 hover:border-[#D4AF37]/30 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(212,175,55,0.05)]";
                                let iconColor = "text-gray-500";
                                let statusLabel = "Livre";
                                let statusBadge = "bg-green-500/10 border-green-500/20 text-green-400";
                                
                                if (isOccupied) {
                                    cardStyle = "border-red-500/30 bg-red-950/10 shadow-[inset_0_0_25px_rgba(239,68,68,0.05)] hover:border-red-500/50 hover:scale-[1.03]";
                                    iconColor = "text-red-500 animate-pulse";
                                    statusLabel = "Em Consumo";
                                    statusBadge = "bg-red-500/20 border-red-500/30 text-red-400";
                                } else if (isReserved) {
                                    cardStyle = "border-[#D4AF37]/30 bg-[#D4AF37]/5 shadow-[inset_0_0_25px_rgba(212,175,55,0.05)] hover:border-[#D4AF37]/50 hover:scale-[1.03]";
                                    iconColor = "text-[#D4AF37]";
                                    statusLabel = `Reservada (${tableReservation.reservation_time.slice(0, 5)})`;
                                    statusBadge = "bg-[#D4AF37]/20 border-[#D4AF37]/30 text-[#D4AF37]";
                                }

                                return (
                                    <div
                                        key={tableName}
                                        onClick={() => handleTableClick(tableName, tableOrder, tableReservation)}
                                        className={`bg-[#121213]/90 border rounded-[2.5rem] p-6 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 min-h-[190px] relative ${cardStyle}`}
                                    >
                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusBadge} absolute top-4`}>
                                            {statusLabel}
                                        </span>

                                        <div className="mt-8 flex flex-col items-center gap-2 flex-1 justify-center">
                                            <div className={`p-4 bg-white/5 rounded-2xl border border-white/5 ${iconColor}`}>
                                                <Utensils size={24} />
                                            </div>
                                            <h4 className="font-serif font-black text-white text-base tracking-tight">{tableName}</h4>
                                        </div>

                                        {isOccupied && (
                                            <div className="w-full pt-3 border-t border-white/5 mt-2">
                                                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                                                    {tableOrder.total?.toLocaleString('pt-AO')} Kz
                                                </span>
                                            </div>
                                        )}

                                        {isReserved && (
                                            <div className="w-full pt-3 border-t border-white/5 mt-2 truncate max-w-full">
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    👤 {tableReservation.customer_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-black/40 border border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4">
                            <Settings2 className="text-gray-600" size={48} />
                            <h4 className="font-serif font-bold text-gray-300">Nenhuma mesa configurada</h4>
                            <p className="text-gray-500 text-xs max-w-xs">Adicione mesas nas definições gerais da loja para começar a usar o mapa.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Assign Tables Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0B] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-[60px] -mr-24 -mt-24"></div>
                        <div className="p-8 relative z-10">
                            <h3 className="text-2xl font-serif font-black text-white mb-2">Atribuir Mesas</h3>
                            <p className="text-xs text-gray-400 mb-6 font-medium">Selecione as mesas para a reserva de <span className="text-[#D4AF37] font-bold">{showAssignModal.customer_name}</span> ({showAssignModal.num_tables} solicitadas).</p>

                            <div className="grid grid-cols-3 gap-3 mb-8">
                                {tableMap.length > 0 ? tableMap.map(tableName => {
                                    const isOccupied = occupiedTables.includes(tableName);
                                    const isSelected = selectedTables.includes(tableName);

                                    return (
                                        <button
                                            key={tableName}
                                            disabled={isOccupied && !isSelected}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedTables(selectedTables.filter(t => t !== tableName));
                                                } else {
                                                    setSelectedTables([...selectedTables, tableName]);
                                                }
                                            }}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                                isOccupied
                                                    ? 'bg-red-950/40 border-red-500/30 text-red-500/40 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] border-[#D4AF37] text-black font-black shadow-[0_0_20px_rgba(212,175,55,0.5)] scale-105'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-sm font-black">{tableName}</span>
                                            {isOccupied && <span className="text-[9px] uppercase tracking-wider opacity-60 font-mono">Ocupada</span>}
                                        </button>
                                    );
                                }) : (
                                    <div className="col-span-3 py-8 text-center text-gray-500 text-xs italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        Nenhuma mesa configurada em "Horários & Info".
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowAssignModal(null)}
                                    className="flex-1 px-6 py-4 rounded-full bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs tracking-wider uppercase cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => updateStatus(showAssignModal.id, 'confirmed', null, selectedTables)}
                                    className="flex-1 px-6 py-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] text-black font-black hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0B] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[60px] -mr-24 -mt-24"></div>
                        <div className="p-8 relative z-10">
                            <div className="w-16 h-16 bg-red-950/50 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                <XCircle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-black text-white mb-2">Recusar Reserva</h3>
                            <p className="text-xs text-gray-400 mb-6 font-medium">Informe ao cliente o motivo da recusa para a reserva de <span className="text-red-400 font-bold">{showRejectModal.customer_name}</span>.</p>

                            <div className="space-y-4 mb-8">
                                <textarea
                                    className="w-full bg-[#121213] border border-white/10 rounded-2xl p-4 text-white text-xs focus:outline-none focus:border-red-500/50 min-h-[120px] shadow-inner font-sans leading-relaxed placeholder-gray-600"
                                    placeholder="Ex: Pedimos desculpa, mas o restaurante encontra-se lotado neste horário..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                                <div className="flex flex-wrap gap-2">
                                    {['Restaurante Lotado', 'Horário Indisponível', 'Evento Privado'].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setRejectionReason(suggestion)}
                                            className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all font-mono cursor-pointer active:scale-95"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowRejectModal(null)}
                                    className="flex-1 px-6 py-4 rounded-full bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs tracking-wider uppercase cursor-pointer"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={confirmReject}
                                    className="flex-1 px-6 py-4 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-black hover:brightness-110 shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer"
                                >
                                    Confirmar Recusa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Notification Modal */}
            {showWhatsAppModal && (
                <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0B] w-full max-w-md rounded-[2.5rem] border border-[#D4AF37]/30 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#25D366]/10 rounded-full blur-[60px] -mr-24 -mt-24"></div>
                        <div className="p-8 relative z-10">
                            {/* WhatsApp Glowing Logo */}
                            <div className="w-16 h-16 bg-[#25D366]/20 rounded-2xl flex items-center justify-center mb-6 border border-[#25D366]/30 shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                                <svg viewBox="0 0 24 24" width="32" height="32" stroke="#25D366" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                            </div>
                            
                            <h3 className="text-2.5xl font-serif font-black text-white mb-2">Notificar Cliente</h3>
                            <p className="text-xs text-gray-400 mb-6 font-medium">
                                A reserva de <span className="text-[#D4AF37] font-bold">{showWhatsAppModal.customerName}</span> foi guardada. Envie a notificação oficial por WhatsApp:
                            </p>

                            {/* Message Preview Container */}
                            <div className="bg-black/50 border border-white/5 rounded-2xl p-5 mb-6 text-xs text-gray-300 font-light leading-relaxed max-h-[220px] overflow-y-auto custom-scrollbar relative shadow-inner select-all">
                                <div className="absolute top-2 right-2 text-[9px] font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">Visualização</div>
                                <p className="whitespace-pre-line pr-12">{showWhatsAppModal.messageText}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <a
                                    href={showWhatsAppModal.whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setShowWhatsAppModal(null)}
                                    className="w-full py-4.5 rounded-full bg-gradient-to-r from-[#25C366] to-[#25D366] text-black font-black hover:brightness-110 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 cursor-pointer text-center"
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    Enviar Notificação WhatsApp
                                </a>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(showWhatsAppModal.messageText);
                                            toast.success("Mensagem copiada para a área de transferência!");
                                        }}
                                        className="flex-1 px-5 py-4 rounded-full bg-white/5 border border-white/10 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs tracking-wider uppercase cursor-pointer"
                                    >
                                        Copiar Texto
                                    </button>
                                    
                                    <button
                                        onClick={() => setShowWhatsAppModal(null)}
                                        className="flex-1 px-5 py-4 rounded-full bg-white/5 text-gray-500 font-bold hover:bg-white/10 hover:text-gray-300 transition-all text-xs tracking-wider uppercase cursor-pointer"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Quick Table Management / Order Modal */}
            {showQuickOrderModal && selectedTableDetails && (
                <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0B] w-full max-w-4xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                        {/* LEFT COLUMN: Consumption & Action Buttons */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-[10px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-0.5 rounded-md border border-[#D4AF37]/20 uppercase tracking-widest font-black">
                                            {selectedTableDetails.order ? 'Mesa Ocupada' : 'Mesa Livre'}
                                        </span>
                                        <h3 className="text-2.5xl font-serif font-black text-white mt-1.5">{selectedTableDetails.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowQuickOrderModal(false)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Cliente</label>
                                        <input
                                            type="text"
                                            value={customerNameInput}
                                            onChange={(e) => setCustomerNameInput(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                                            placeholder="Nome do cliente na mesa..."
                                        />
                                    </div>

                                    {/* Cart List */}
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-2">Consumo da Mesa</label>
                                        {quickCart.length > 0 ? (
                                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                                {quickCart.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-2xl text-xs">
                                                        <div className="flex-1 min-w-0 pr-3">
                                                            <p className="font-bold text-gray-200 truncate">{item.name}</p>
                                                            <p className="text-[#D4AF37] font-mono text-[10px] mt-0.5">{item.price?.toLocaleString()} Kz</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white border border-white/5 transition-all cursor-pointer font-bold text-xs"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="font-mono font-bold text-white text-xs w-6 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white border border-white/5 transition-all cursor-pointer font-bold text-xs"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveFromQuickCart(item.id)}
                                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer ml-1.5"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center bg-black/20 border border-white/5 rounded-2xl flex flex-col items-center gap-1.5">
                                                <Utensils className="text-gray-600" size={24} />
                                                <p className="text-gray-500 text-[10px] font-bold uppercase">Nenhum item lançado</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Total and actions */}
                            <div className="pt-6 border-t border-white/5 mt-6">
                                <div className="flex justify-between items-baseline mb-5">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Subtotal Acumulado</span>
                                    <strong className="text-xl font-mono text-[#D4AF37]">
                                        {quickCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} Kz
                                    </strong>
                                </div>

                                <div className="space-y-3">
                                    {selectedTableDetails.order ? (
                                        <>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handlePrintPreInvoice}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4.5 rounded-full text-xs uppercase border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <Receipt size={14} /> Pré-Fatura
                                                </button>
                                                <button
                                                    onClick={handleCloseTableOrder}
                                                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold py-4.5 rounded-full text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <CheckCheck size={14} /> Fechar Conta
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleUpdateTableOrder}
                                                className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-black font-black py-4 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/10 transition-all cursor-pointer text-center"
                                            >
                                                Atualizar Consumo
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleStartTableOrder}
                                            className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-black font-black py-4.5 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/10 transition-all cursor-pointer text-center"
                                        >
                                            Iniciar Pedido (Mesa Ocupada)
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Quick Products Grid for Adding Items */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-black/40 flex flex-col max-h-[50vh] md:max-h-[none] overflow-hidden">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar artigo..."
                                    value={quickSearchQuery}
                                    onChange={(e) => setQuickSearchQuery(e.target.value)}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pr-1">
                                {productsList
                                    .filter(p => !quickSearchQuery || p.name.toLowerCase().includes(quickSearchQuery.toLowerCase()))
                                    .map((product) => {
                                        const productImg = product.img || product.img_url || product.image_url;
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => handleAddToQuickCart(product)}
                                                className="bg-[#121213] border border-white/5 rounded-2xl p-3 flex flex-col justify-between items-center text-center cursor-pointer hover:border-[#D4AF37]/40 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[120px]"
                                            >
                                                {productImg ? (
                                                    <img src={productImg} alt={product.name} className="w-10 h-10 rounded-xl object-cover mb-2 border border-white/10" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 mb-2">
                                                        <Utensils size={16} />
                                                    </div>
                                                )}
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <p className="text-[11px] font-bold text-gray-200 line-clamp-2 leading-tight">{product.name}</p>
                                                    <p className="text-[#D4AF37] font-mono text-[10px] font-bold mt-1">{product.price?.toLocaleString()} Kz</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Quick Table Management / Order Modal */}
            {showQuickOrderModal && selectedTableDetails && (
                <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0B] w-full max-w-4xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                        {/* LEFT COLUMN: Consumption & Action Buttons */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-[10px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-0.5 rounded-md border border-[#D4AF37]/20 uppercase tracking-widest font-black">
                                            {selectedTableDetails.order ? 'Mesa Ocupada' : 'Mesa Livre'}
                                        </span>
                                        <h3 className="text-2.5xl font-serif font-black text-white mt-1.5">{selectedTableDetails.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowQuickOrderModal(false)}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Cliente</label>
                                        <input
                                            type="text"
                                            value={customerNameInput}
                                            onChange={(e) => setCustomerNameInput(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                                            placeholder="Nome do cliente na mesa..."
                                        />
                                    </div>

                                    {/* Cart List */}
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-2">Consumo da Mesa</label>
                                        {quickCart.length > 0 ? (
                                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                                {quickCart.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-2xl text-xs">
                                                        <div className="flex-1 min-w-0 pr-3">
                                                            <p className="font-bold text-gray-200 truncate">{item.name}</p>
                                                            <p className="text-[#D4AF37] font-mono text-[10px] mt-0.5">{item.price?.toLocaleString()} Kz</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white border border-white/5 transition-all cursor-pointer font-bold text-xs"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="font-mono font-bold text-white text-xs w-6 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white border border-white/5 transition-all cursor-pointer font-bold text-xs"
                                                            >
                                                                +
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveFromQuickCart(item.id)}
                                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer ml-1.5"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center bg-black/20 border border-white/5 rounded-2xl flex flex-col items-center gap-1.5">
                                                <Utensils className="text-gray-600" size={24} />
                                                <p className="text-gray-500 text-[10px] font-bold uppercase">Nenhum item lançado</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Total and actions */}
                            <div className="pt-6 border-t border-white/5 mt-6">
                                <div className="flex justify-between items-baseline mb-5">
                                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Subtotal Acumulado</span>
                                    <strong className="text-xl font-mono text-[#D4AF37]">
                                        {quickCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} Kz
                                    </strong>
                                </div>

                                <div className="space-y-3">
                                    {selectedTableDetails.order ? (
                                        <>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handlePrintPreInvoice}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4.5 rounded-full text-xs uppercase border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <Receipt size={14} /> Pré-Fatura
                                                </button>
                                                <button
                                                    onClick={handleCloseTableOrder}
                                                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold py-4.5 rounded-full text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <CheckCheck size={14} /> Fechar Conta
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleUpdateTableOrder}
                                                className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-black font-black py-4 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/10 transition-all cursor-pointer text-center"
                                            >
                                                Atualizar Consumo
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleStartTableOrder}
                                            className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-black font-black py-4.5 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/10 transition-all cursor-pointer text-center"
                                        >
                                            Iniciar Pedido (Mesa Ocupada)
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Quick Products Grid for Adding Items */}
                        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-black/40 flex flex-col max-h-[50vh] md:max-h-[none] overflow-hidden">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar artigo..."
                                    value={quickSearchQuery}
                                    onChange={(e) => setQuickSearchQuery(e.target.value)}
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pr-1">
                                {productsList
                                    .filter(p => !quickSearchQuery || p.name.toLowerCase().includes(quickSearchQuery.toLowerCase()))
                                    .map((product) => {
                                        const productImg = product.img || product.img_url || product.image_url;
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => handleAddToQuickCart(product)}
                                                className="bg-[#121213] border border-white/5 rounded-2xl p-3 flex flex-col justify-between items-center text-center cursor-pointer hover:border-[#D4AF37]/40 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[120px]"
                                            >
                                                {productImg ? (
                                                    <img src={productImg} alt={product.name} className="w-10 h-10 rounded-xl object-cover mb-2 border border-white/10" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 mb-2">
                                                        <Utensils size={16} />
                                                    </div>
                                                )}
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <p className="text-[11px] font-bold text-gray-200 line-clamp-2 leading-tight">{product.name}</p>
                                                    <p className="text-[#D4AF37] font-mono text-[10px] font-bold mt-1">{product.price?.toLocaleString()} Kz</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationManager;

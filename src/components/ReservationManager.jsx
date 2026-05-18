import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Users, Phone, Clock, CheckCircle, XCircle, Filter, Search, MoreVertical, ChevronRight, User, Sparkles } from 'lucide-react';
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
    { name: 'Jantar Casal', value: 25, color: '#F5C542' },
    { name: 'Almoço de Grupo', value: 38, color: '#3B82F6' },
    { name: 'Evento Corporativo', value: 23.9, color: '#8E8E93' },
    { name: 'Aniversários / Festas', value: 13.1, color: '#D4AF37' },
];

const ReservationManager = ({ restaurantId }) => {
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

    useEffect(() => {
        if (restaurantId) {
            fetchReservations();
            fetchTableMap();

            const subscription = supabase
                .channel('reservations-admin')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurantId}`
                }, () => {
                    fetchReservations();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
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
            {/* 3 Top Glowing Dash Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1: Total de Reservas */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden group hover:border-[#D4AF37]/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-[#D4AF37]/20 transition-all duration-700"></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">TOTAL DE RESERVAS</p>
                        <p className="text-4xl font-serif font-black text-[#D4AF37] tracking-tight mt-2">{reservations.length}</p>
                    </div>
                </div>

                {/* Card 2: Confirmadas */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)] relative overflow-hidden group hover:border-green-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-green-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all duration-700"></div>
                    <div>
                        <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest mb-1">CONFIRMADAS</p>
                        <p className="text-4xl font-serif font-black text-green-500 tracking-tight mt-2">{confirmedCount}</p>
                    </div>
                </div>

                {/* Card 3: Pendentes Hoje */}
                <div className="bg-gradient-to-br from-[#1E1E1E]/95 via-[#161616]/95 to-[#101010]/95 backdrop-blur-xl p-7 rounded-[2.5rem] border border-amber-500/30 shadow-[0_0_40px_rgba(245,197,66,0.15)] relative overflow-hidden group hover:border-amber-500/60 transition-all duration-500 flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700"></div>
                    <div>
                        <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">PENDENTES HOJE</p>
                        <p className="text-4xl font-serif font-black text-amber-400 tracking-tight mt-2">{pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Search + Filter Pill Bar */}
            <div className="bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-full p-2.5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
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
                                        ? 'bg-gradient-to-r from-[#F5C542] via-[#EAC775] to-[#D4AF37] text-black font-black shadow-[0_0_20px_rgba(245,197,66,0.5)] scale-105' 
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
                <div className="lg:col-span-5 bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/30 transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-serif font-bold text-lg text-white">Reservas por Período</h3>
                        <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5">
                            {['Dia', 'Semana', 'Mês'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setPeriodTab(t)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                        periodTab === t 
                                            ? 'bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-black shadow-[0_0_12px_rgba(245,197,66,0.4)]' 
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
                                        <stop offset="5%" stopColor="#F5C542" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#F5C542" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="blueResArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#242424" />
                                <XAxis dataKey="time" stroke="#777" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#777" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #F5C542', borderRadius: '16px', color: '#fff', boxShadow: '0 0 20px rgba(245,197,66,0.3)' }} />
                                <Area type="monotone" dataKey="grupo" stroke="#3B82F6" strokeWidth={2.5} fill="url(#blueResArea)" name="Grupos" />
                                <Area type="monotone" dataKey="casal" stroke="#F5C542" strokeWidth={3.5} fill="url(#goldResArea)" name="Casais" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Section 2: Mix de Reservas */}
                <div className="lg:col-span-4 bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/30 transition-all">
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
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#161616" strokeWidth={3} className="hover:opacity-80 transition-opacity" />
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
                <div className="lg:col-span-3 bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between relative hover:border-[#D4AF37]/30 transition-all max-h-[380px] overflow-hidden">
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
            <div className="bg-[#161616]/90 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-2 sm:p-6 shadow-2xl overflow-hidden">
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
                                                    <div className="w-full h-full rounded-2xl bg-[#121212] flex items-center justify-center">
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

            {/* Assign Tables Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
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
                                                        ? 'bg-gradient-to-br from-[#F5C542] to-[#D4AF37] border-[#D4AF37] text-black font-black shadow-[0_0_20px_rgba(212,175,55,0.5)] scale-105'
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
                                    className="flex-1 px-6 py-4 rounded-full bg-gradient-to-r from-[#F5C542] to-[#D4AF37] text-black font-black hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer"
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
                    <div className="bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-[60px] -mr-24 -mt-24"></div>
                        <div className="p-8 relative z-10">
                            <div className="w-16 h-16 bg-red-950/50 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                <XCircle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-serif font-black text-white mb-2">Recusar Reserva</h3>
                            <p className="text-xs text-gray-400 mb-6 font-medium">Informe ao cliente o motivo da recusa para a reserva de <span className="text-red-400 font-bold">{showRejectModal.customer_name}</span>.</p>

                            <div className="space-y-4 mb-8">
                                <textarea
                                    className="w-full bg-[#161616] border border-white/10 rounded-2xl p-4 text-white text-xs focus:outline-none focus:border-red-500/50 min-h-[120px] shadow-inner font-sans leading-relaxed placeholder-gray-600"
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
        </div>
    );
};

export default ReservationManager;

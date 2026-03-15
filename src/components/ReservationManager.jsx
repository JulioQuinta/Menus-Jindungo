import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, Users, Phone, Clock, CheckCircle, XCircle, Filter, Search, MoreVertical, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

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

    useEffect(() => {
        if (restaurantId) {
            fetchReservations();

            // Real-time subscription for new reservations
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
        const matchesSearch = res.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.customer_phone.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total de Reservas</p>
                    <h3 className="text-3xl font-bold text-white">{reservations.length}</h3>
                </div>
                <div className="bg-green-500/5 p-6 rounded-3xl border border-green-500/10 backdrop-blur-sm">
                    <p className="text-green-500/60 text-xs font-bold uppercase tracking-widest mb-2">Confirmadas</p>
                    <h3 className="text-3xl font-bold text-green-400">
                        {reservations.filter(r => r.status === 'confirmed').length}
                    </h3>
                </div>
                <div className="bg-yellow-500/5 p-6 rounded-3xl border border-yellow-500/10 backdrop-blur-sm">
                    <p className="text-yellow-500/60 text-xs font-bold uppercase tracking-widest mb-2">Pendentes Hoje</p>
                    <h3 className="text-3xl font-bold text-yellow-400">
                        {reservations.filter(r => r.status === 'pending').length}
                    </h3>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 bg-[#111111] p-4 rounded-2xl border border-white/5">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou telemóvel..."
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5">
                    {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {f === 'all' ? 'Todas' : getStatusLabel(f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table/List */}
            <div className="bg-[#111111] rounded-3xl border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 animate-pulse">Carregando reservas...</div>
                ) : filteredReservations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Data & Hora</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Pessoas / Mesas</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReservations.map((res) => (
                                    <tr key={res.id} className="border-b border-white/5 hover:bg-white/5 h-20 transition-colors">
                                        <td className="px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                    <User size={18} className="text-[#D4AF37]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{res.customer_name}</p>
                                                    <p className="text-gray-500 text-[10px]">{res.customer_phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar size={14} className="text-[#D4AF37]" />
                                                <span>{new Date(res.reservation_date).toLocaleDateString()}</span>
                                                <span className="text-gray-500 ml-1">às {res.reservation_time.slice(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="text-[#D4AF37] opacity-60" />
                                                    <span className="font-bold text-sm">{res.num_people} Pessoas</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4AF37] opacity-60"><path d="M12 3v18" /><path d="m5 8 14 0" /><path d="m5 16 14 0" /></svg>
                                                    <span className="font-medium text-xs text-gray-400">
                                                        {res.assigned_tables?.length > 0
                                                            ? `Mesas: ${res.assigned_tables.join(', ')}`
                                                            : `${res.num_tables} Mesas Solicitadas`}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusStyles(res.status)}`}>
                                                {getStatusLabel(res.status)}
                                            </span>
                                        </td>
                                        <td className="px-6">
                                            <div className="flex items-center gap-2">
                                                {res.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirmRequest(res)}
                                                            className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition-colors border border-transparent hover:border-green-500/20"
                                                            title="Confirmar e Atribuir Mesas"
                                                        >
                                                            <CheckCircle size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(res)}
                                                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                            title="Rejeitar"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {res.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleRejectClick(res)}
                                                        className="px-3 py-1.5 text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all font-mono"
                                                    >
                                                        CANCELAR
                                                    </button>
                                                )}
                                            </div>
                                            {res.rejection_reason && (
                                                <p className="mt-2 text-[9px] text-red-400/60 line-clamp-1 italic">
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
                    <div className="p-24 text-center">
                        <Calendar className="mx-auto text-gray-700 mb-4 opacity-30" size={64} />
                        <p className="text-gray-500 font-bold">Nenhuma reserva encontrada</p>
                    </div>
                )}
            </div>
            {/* Assign Tables Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#121212] w-full max-w-md rounded-[32px] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <h3 className="text-xl font-bold text-white mb-2">Atribuir Mesas</h3>
                            <p className="text-sm text-gray-400 mb-6 font-medium">Selecione as mesas para {showAssignModal.customer_name} ({showAssignModal.num_tables} solicitadas).</p>

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
                                            className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${isOccupied
                                                ? 'bg-red-500/10 border-red-500/20 text-red-500/40 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="text-xs font-black">{tableName}</span>
                                            {isOccupied && <span className="text-[10px] opacity-60">Ocupada</span>}
                                        </button>
                                    );
                                }) : (
                                    <div className="col-span-3 py-6 text-center text-gray-500 text-xs italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        Nenhuma mesa configurada em "Horários & Info".
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAssignModal(null)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => updateStatus(showAssignModal.id, 'confirmed', null, selectedTables)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-[#D4AF37] text-black font-bold hover:brightness-110 shadow-lg transition-all text-sm"
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
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#121212] w-full max-w-md rounded-[32px] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                                <XCircle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Recusar Reserva</h3>
                            <p className="text-sm text-gray-400 mb-6">Informe ao cliente o motivo da recusa para {showRejectModal.customer_name}.</p>

                            <div className="space-y-4 mb-8">
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-red-500/50 min-h-[120px] text-sm"
                                    placeholder="Ex: Não temos mesas disponíveis para este horário..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                                <div className="flex flex-wrap gap-2">
                                    {['Restaurante Lotado', 'Horário Indisponível', 'Evento Privado'].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setRejectionReason(suggestion)}
                                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all font-mono"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(null)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-sm"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={confirmReject}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg transition-all text-sm"
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

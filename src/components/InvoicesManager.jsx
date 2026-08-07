import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Calendar, FileText, TrendingUp, Download, Printer, RefreshCw, ShoppingBag, Eye, User, CreditCard, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReceiptModal from './ReceiptModal';

const InvoicesManager = ({ restaurantId, restaurantName }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('invoices'); // 'invoices' or 'sold_items'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, draft, pending_agt, validated, rejected
    const [periodFilter, setPeriodFilter] = useState('month'); // today, yesterday, week, month, all
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Fetch orders with invoice details
    const fetchOrders = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const { start, end } = getDateRange(periodFilter);

            let query = supabase
                .from('orders')
                .select('*, restaurant:restaurants(name, business_info, slug, invoice_config)')
                .eq('restaurant_id', restaurantId);

            if (start) {
                query = query.gte('created_at', start.toISOString());
            }
            if (end) {
                query = query.lte('created_at', end.toISOString());
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error("Error fetching invoices:", err);
            toast.error("Erro ao carregar faturas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [restaurantId, periodFilter]);

    // Helper for date ranges
    const getDateRange = (period) => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (period === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'yesterday') {
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setDate(now.getDate() - 1);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            const day = now.getDay() || 7;
            start.setDate(now.getDate() - day + 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else {
            // all time
            return { start: null, end: null };
        }
        return { start, end };
    };

    // Filter and search invoices
    const filteredInvoices = orders.filter(o => {
        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'draft' && o.invoice_status !== 'draft' && o.invoice_status !== null) return false;
            if (statusFilter !== 'draft' && o.invoice_status !== statusFilter) return false;
        }

        // Search query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const clientName = (o.customer_name || '').toLowerCase();
            const clientNif = (o.customer_nif || '').toLowerCase();
            const id = o.id.toLowerCase();
            const invoiceNum = (o.invoice_number || '').toLowerCase();
            
            return clientName.includes(query) || clientNif.includes(query) || id.includes(query) || invoiceNum.includes(query);
        }

        return true;
    });

    // Aggregate sold items
    const soldItems = React.useMemo(() => {
        const itemMap = {};
        orders.forEach(order => {
            // Exclude cancelled/rejected orders
            if (order.status !== 'cancelled' && order.status !== 'rejected') {
                order.items?.forEach(item => {
                    const name = item.name;
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.price) || 0;
                    const category = item.category || 'Outros';

                    if (!itemMap[name]) {
                        itemMap[name] = {
                            name,
                            quantity: 0,
                            revenue: 0,
                            category
                        };
                    }
                    itemMap[name].quantity += qty;
                    itemMap[name].revenue += (price * qty);
                });
            }
        });
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    }, [orders]);

    // Export Invoices CSV
    const exportSalesCSV = () => {
        if (filteredInvoices.length === 0) {
            toast.error("Sem faturas para exportar.");
            return;
        }
        const csvHeaders = "\uFEFFID Encomenda,N. Fatura,Data/Hora,Cliente,NIF Cliente,Status Fiscal,Total (Kz),Itens\n";
        const csvRows = filteredInvoices.map(o => {
            const dateStr = new Date(o.created_at).toLocaleString('pt-PT');
            const client = o.customer_name || 'Consumidor Final';
            const nif = o.customer_nif || '999999999';
            const status = o.invoice_status === 'validated' ? 'Validada na AGT' : o.invoice_status === 'pending_agt' ? 'Pendente' : o.invoice_status === 'rejected' ? 'Rejeitada' : 'Rascunho';
            const itemsStr = o.items?.map(i => `${i.name} (x${i.quantity})`).join('; ') || '';
            return `"${o.id.slice(0, 8)}","${o.invoice_number || 'N/A'}","${dateStr}","${client}","${nif}","${status}",${o.total || 0},"${itemsStr.replace(/"/g, '""')}"`;
        }).join('\n');

        const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `relatorio_faturas_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório de Faturas exportado!");
    };

    // Export Items CSV
    const exportItemsCSV = () => {
        if (soldItems.length === 0) {
            toast.error("Sem itens vendidos no período.");
            return;
        }
        const csvHeaders = "\uFEFFProduto,Categoria,Quantidade Vendida,Faturação Total (Kz)\n";
        const csvRows = soldItems.map(p => {
            return `"${p.name}","${p.category}",${p.quantity},${p.revenue}`;
        }).join('\n');

        const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `relatorio_itens_vendidos_${periodFilter}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório de Itens Vendidos exportado!");
    };

    // Style Helpers
    const getStatusBadge = (status) => {
        switch (status) {
            case 'validated':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 size={11} /> Validada
                    </span>
                );
            case 'pending_agt':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                        <RefreshCw size={11} className="animate-spin" /> Pendente
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">
                        <AlertTriangle size={11} /> Rejeitada
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-400">
                        <Clock size={11} /> Rascunho
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#181818]/95 via-[#141414]/95 to-[#101010]/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[#D4AF37]/20 shadow-[0_0_50px_rgba(212,175,55,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/5 blur-[90px] rounded-full pointer-events-none" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-[#D4AF37]" size={28} />
                        Faturação & Vendas
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gerir faturas homologadas na AGT e analisar a listagem de artigos vendidos no restaurante.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex gap-1">
                        <button
                            onClick={() => setActiveSubTab('invoices')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'invoices' ? 'bg-[#D4AF37] text-black font-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
                        >
                            Faturas Emitidas
                        </button>
                        <button
                            onClick={() => setActiveSubTab('sold_items')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'sold_items' ? 'bg-[#D4AF37] text-black font-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
                        >
                            Itens Vendidos
                        </button>
                    </div>

                    <button 
                        onClick={activeSubTab === 'invoices' ? exportSalesCSV : exportItemsCSV}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold p-3 rounded-2xl transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs uppercase"
                        title="Exportar CSV"
                    >
                        <Download size={15} /> Exportar
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
                        <FileText size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Faturas Emitidas</span>
                        <strong className="text-2xl font-mono text-white mt-1 block">{filteredInvoices.length}</strong>
                    </div>
                </div>
                
                <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Faturação Total</span>
                        <strong className="text-2xl font-mono text-[#D4AF37] mt-1 block">
                            {filteredInvoices.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('pt-AO')} <span className="text-xs">Kz</span>
                        </strong>
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Artigos Vendidos</span>
                        <strong className="text-2xl font-mono text-white mt-1 block">
                            {soldItems.reduce((sum, p) => sum + p.quantity, 0)} <span className="text-xs">unidades</span>
                        </strong>
                    </div>
                </div>
            </div>

            {/* Main Section */}
            <div className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                
                {/* Search & Filters */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-white/[0.01] to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex gap-1">
                            {['month', 'week', 'today', 'all'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriodFilter(p)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all ${periodFilter === p ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 bg-transparent'}`}
                                >
                                    {p === 'month' ? 'Este Mês' : p === 'week' ? 'Esta Semana' : p === 'today' ? 'Hoje' : 'Tudo'}
                                </button>
                            ))}
                        </div>

                        {activeSubTab === 'invoices' && (
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-[#121212] border border-white/10 text-xs font-bold text-gray-300 px-4 py-2.5 rounded-2xl outline-none focus:border-[#D4AF37]"
                            >
                                <option value="all">Todos os Estados AGT</option>
                                <option value="draft">Rascunho (Não comunicadas)</option>
                                <option value="pending_agt">Pendente de Validação</option>
                                <option value="validated">Validadas pela AGT</option>
                                <option value="rejected">Rejeitadas pela AGT</option>
                            </select>
                        )}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder={activeSubTab === 'invoices' ? "Pesquisar faturas, NIF ou cliente..." : "Filtrar por nome do produto..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-bold"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mb-4"></div>
                        <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">A carregar dados...</span>
                    </div>
                ) : (
                    <>
                        {/* SUBTAB 1: INVOICES LIST */}
                        {activeSubTab === 'invoices' && (
                            <div className="overflow-x-auto">
                                {filteredInvoices.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 text-gray-500 font-bold text-[10px] uppercase tracking-wider bg-white/[0.01]">
                                                <th className="py-4 px-6 font-medium">N.º Fatura / ID</th>
                                                <th className="py-4 px-6 font-medium">Data Emissão</th>
                                                <th className="py-4 px-6 font-medium">Cliente / NIF</th>
                                                <th className="py-4 px-6 font-medium">Total Geral</th>
                                                <th className="py-4 px-6 font-medium text-center">Estado AGT</th>
                                                <th className="py-4 px-6 text-center font-medium">Visualizar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs">
                                            {filteredInvoices.map((order) => (
                                                <tr key={order.id} className="hover:bg-white/[0.02] transition-all group">
                                                    <td className="py-4 px-6">
                                                        <div className="font-bold text-white font-mono leading-none mb-1 text-sm">
                                                            {order.invoice_number || `Rascunho #${order.id.slice(0, 6)}`}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                            UUID: {order.id.slice(0, 8)}...
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-400 font-mono">
                                                        {new Date(order.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="font-bold text-gray-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                                                            <User size={13} className="text-gray-500" />
                                                            {order.customer_name || 'Consumidor Final'}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-1 font-mono">
                                                            NIF: {order.customer_nif || '999999999'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="text-sm font-bold text-[#D4AF37] leading-none mb-1">
                                                            {order.total?.toLocaleString('pt-AO')} <span className="text-[10px] text-[#D4AF37]/60">Kz</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 font-bold uppercase">
                                                            {order.payment_method || 'Numerário'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        {getStatusBadge(order.invoice_status)}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="p-2 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-xl text-gray-300 transition-all cursor-pointer inline-flex items-center justify-center hover:scale-105 active:scale-95 border border-white/5 hover:border-transparent"
                                                            title="Ver Detalhes / Fatura"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                            <FileText size={24} className="text-gray-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-300">Nenhuma fatura localizada</h3>
                                        <p className="text-gray-500 text-xs max-w-sm mt-1">Não existem faturas emitidas que correspondam aos filtros de pesquisa selecionados.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUBTAB 2: SOLD ITEMS RANKING */}
                        {activeSubTab === 'sold_items' && (
                            <div className="overflow-x-auto">
                                {soldItems.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 text-gray-500 font-bold text-[10px] uppercase tracking-wider bg-white/[0.01]">
                                                <th className="py-4 px-6 font-medium text-center w-16">Posição</th>
                                                <th className="py-4 px-6 font-medium">Nome do Produto</th>
                                                <th className="py-4 px-6 font-medium">Categoria</th>
                                                <th className="py-4 px-6 font-medium text-center">Qtd. Vendida</th>
                                                <th className="py-4 px-6 text-right font-medium">Receita de Venda</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs">
                                            {soldItems
                                                .filter(item => searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((item, index) => (
                                                    <tr key={index} className="hover:bg-white/[0.02] transition-all group">
                                                        <td className="py-4 px-6 text-center font-mono font-bold">
                                                            {index === 0 && <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 flex items-center justify-center mx-auto text-[10px]">🥇</span>}
                                                            {index === 1 && <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/30 flex items-center justify-center mx-auto text-[10px]">🥈</span>}
                                                            {index === 2 && <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center mx-auto text-[10px]">🥉</span>}
                                                            {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
                                                        </td>
                                                        <td className="py-4 px-6 font-bold text-white">
                                                            {item.name}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-gray-400 capitalize">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center font-mono font-bold text-gray-200">
                                                            {item.quantity}x
                                                        </td>
                                                        <td className="py-4 px-6 text-right font-mono font-bold text-[#D4AF37] text-sm">
                                                            {item.revenue.toLocaleString('pt-AO')} <span className="text-[10px] text-[#D4AF37]/60">Kz</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                            <ShoppingBag size={24} className="text-gray-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-300">Nenhum item vendido no período</h3>
                                        <p className="text-gray-500 text-xs max-w-sm mt-1">Os pedidos faturados e entregues no período selecionado aparecerão consolidados neste ranking.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de Detalhes Fiscais / Impressão */}
            {selectedOrder && (
                <ReceiptModal
                    isOpen={!!selectedOrder}
                    onClose={() => {
                        setSelectedOrder(null);
                        fetchOrders(); // Refresh order details if validated
                    }}
                    order={selectedOrder}
                    restaurantName={restaurantName}
                />
            )}
        </div>
    );
};

export default InvoicesManager;

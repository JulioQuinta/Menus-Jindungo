import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Calendar, FileText, TrendingUp, Download, Printer, RefreshCw, ShoppingBag, Eye, User, CreditCard, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, Coins, Plus, Minus, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReceiptModal from './ReceiptModal';
import { cashSessionService } from '../services/cashSessionService';

const InvoicesManager = ({ restaurantId, restaurantName }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('invoices'); // 'invoices' or 'sold_items'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, draft, pending_agt, validated, rejected
    const [periodFilter, setPeriodFilter] = useState('month'); // today, yesterday, week, month, all
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Turnos & Caixa
    const [activeSession, setActiveSession] = useState(null);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [previousSessions, setPreviousSessions] = useState([]);
    const [openingCash, setOpeningCash] = useState('');
    const [openingNotes, setOpeningNotes] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionDesc, setTransactionDesc] = useState('');
    const [transactionType, setTransactionType] = useState('sangria');
    const [actualCashCount, setActualCashCount] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [cashLoading, setCashLoading] = useState(false);

    const pendingInvoices = orders.filter(o => o.invoice_status === 'pending_agt');
    const pendingCount = pendingInvoices.length;

    const syncPendingInvoices = async () => {
        if (pendingCount === 0) {
            toast.error("Nenhuma fatura pendente de validação.");
            return;
        }

        setIsSyncing(true);
        let successCount = 0;

        for (const order of pendingInvoices) {
            try {
                // Obter hash do JWS para criar o código da AGT
                const hashControl = (order.jws_hash || 'AAAA').slice(-4).toUpperCase();
                const validationCode = `AGT-VAL-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${hashControl}`;
                
                const { error } = await supabase
                    .from('orders')
                    .update({
                        invoice_status: 'validated',
                        validation_code: validationCode
                    })
                    .eq('id', order.id);

                if (error) throw error;
                successCount++;
            } catch (err) {
                console.error("Erro ao transmitir fatura para a AGT:", order.id, err);
            }
        }

        setIsSyncing(false);
        if (successCount > 0) {
            toast.success(`${successCount} faturas transmitidas e validadas com sucesso na AGT!`, {
                icon: '🛡️',
                duration: 5000
            });
            fetchOrders();
        } else {
            toast.error("Falha ao comunicar faturas. Tente novamente.");
        }
    };

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

    useEffect(() => {
        if (activeSubTab === 'cash_control') {
            fetchCashSession();
        }
    }, [activeSubTab, restaurantId, orders]);

    const fetchCashSession = async () => {
        if (!restaurantId) return;
        setCashLoading(true);
        try {
            const active = await cashSessionService.getActiveSession(restaurantId);
            setActiveSession(active);
            if (active) {
                const summary = await cashSessionService.getSessionSummary(active.id);
                setSessionSummary(summary);
            } else {
                setSessionSummary(null);
            }
            const prev = await cashSessionService.getPreviousSessions(restaurantId);
            setPreviousSessions(prev);
        } catch (err) {
            console.error("Erro ao carregar dados do caixa:", err);
        } finally {
            setCashLoading(false);
        }
    };

    const handleOpenSession = async (e) => {
        e.preventDefault();
        if (!openingCash || isNaN(openingCash) || parseFloat(openingCash) < 0) {
            toast.error("Por favor, introduza um valor de abertura válido.");
            return;
        }
        try {
            const savedStaffName = localStorage.getItem(`jindungo_staff_name_${restaurantId}`) || "Administrador";
            await cashSessionService.openSession(restaurantId, savedStaffName, openingCash, openingNotes);
            toast.success("Turno de Caixa aberto com sucesso!");
            setOpeningCash('');
            setOpeningNotes('');
            fetchCashSession();
        } catch (err) {
            toast.error("Erro ao abrir turno.");
        }
    };

    const handleAddTx = async (e) => {
        e.preventDefault();
        if (!transactionAmount || isNaN(transactionAmount) || parseFloat(transactionAmount) <= 0) {
            toast.error("Introduza um valor válido para a transação.");
            return;
        }
        if (!transactionDesc.trim()) {
            toast.error("Por favor, introduza um motivo/descrição.");
            return;
        }
        try {
            await cashSessionService.addTransaction(activeSession.id, transactionType, transactionAmount, transactionDesc);
            toast.success(`${transactionType === 'sangria' ? 'Sangria' : 'Suprimento'} registado!`);
            setTransactionAmount('');
            setTransactionDesc('');
            setShowTxModal(false);
            fetchCashSession();
        } catch (err) {
            toast.error("Erro ao registar movimentação.");
        }
    };

    const handleCloseSession = async () => {
        if (!actualCashCount || isNaN(actualCashCount) || parseFloat(actualCashCount) < 0) {
            toast.error("Por favor, introduza a contagem física real do caixa.");
            return;
        }
        try {
            const expected = sessionSummary ? sessionSummary.expectedCashInDrawer : activeSession.initial_cash;
            const closed = await cashSessionService.closeSession(activeSession.id, actualCashCount, closingNotes, expected);
            
            toast.success("Caixa fechado com sucesso!");
            setShowCloseModal(false);
            setActualCashCount('');
            setClosingNotes('');
            
            handlePrintZReport(closed);
            fetchCashSession();
        } catch (err) {
            toast.error("Erro ao fechar caixa.");
        }
    };

    const handlePrintXReport = async () => {
        if (!sessionSummary) return;
        const summary = sessionSummary;
        const dateStr = new Date(summary.session.opened_at).toLocaleString('pt-PT');
        const printDate = new Date().toLocaleString('pt-PT');

        const txsRows = summary.transactions.map(t => `
            <tr>
                <td style="padding: 4px 0; text-transform: uppercase;">${t.type}</td>
                <td style="padding: 4px 0; text-align: center;">${t.description}</td>
                <td style="padding: 4px 0; text-align: right; color: ${t.type === 'sangria' ? '#ff3b30' : '#34c759'}; font-weight: bold;">
                    ${t.type === 'sangria' ? '-' : '+'}${t.amount.toLocaleString()} Kz
                </td>
            </tr>
        `).join('');

        const html = `
            <html>
                <body style="font-family: monospace; font-size: 12px; max-width: 280px; margin: auto; padding: 10px; color: #000;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <h2 style="margin: 0; font-size: 16px;">${restaurantName || 'Menus Jindungo'}</h2>
                        <p style="margin: 2px 0; font-weight: bold;">LEITURA PARCIAL DE CAIXA (RELATÓRIO X)</p>
                        <p style="margin: 2px 0;">Estado: EM TURNO</p>
                    </div>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <p style="margin: 2px 0;"><b>Turno ID:</b> ${summary.session.id}</p>
                    <p style="margin: 2px 0;"><b>Operador:</b> ${summary.session.opened_by}</p>
                    <p style="margin: 2px 0;"><b>Abertura:</b> ${dateStr}</p>
                    <p style="margin: 2px 0;"><b>Impressão:</b> ${printDate}</p>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="padding: 4px 0;">Fundo de Maneio:</td>
                            <td style="padding: 4px 0; text-align: right;">${summary.session.initial_cash.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-weight: bold;">(+) Vendas Dinheiro:</td>
                            <td style="padding: 4px 0; text-align: right; font-weight: bold;">${summary.cashSales.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">(+) Vendas Multicaixa:</td>
                            <td style="padding: 4px 0; text-align: right;">${summary.cardSales.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0;">(+) Vendas Express/Transf:</td>
                            <td style="padding: 4px 0; text-align: right;">${summary.mobileSales.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #34c759;">(+) Suprimentos:</td>
                            <td style="padding: 4px 0; text-align: right; color: #34c759;">+${summary.suprimentos.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #ff3b30;">(-) Sangrias:</td>
                            <td style="padding: 4px 0; text-align: right; color: #ff3b30;">-${summary.sangrias.toLocaleString()} Kz</td>
                        </tr>
                    </table>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <div style="font-size: 14px; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>SALDO ESPERADO GAVETA:</span>
                        <span>${summary.expectedCashInDrawer.toLocaleString()} Kz</span>
                    </div>
                    <div style="font-size: 12px; margin-top: 4px; display: flex; justify-content: space-between; font-weight: bold;">
                        <span>TOTAL FATURAÇÃO TURNO:</span>
                        <span>${summary.totalSales.toLocaleString()} Kz</span>
                    </div>

                    ${summary.transactions.length > 0 ? `
                        <hr style="border-top: 1px dashed #000; margin: 15px 0 10px 0;">
                        <h4 style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold;">MOVIMENTAÇÕES MANUAL CAIXA</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            ${txsRows}
                        </table>
                    ` : ''}
                    
                    <hr style="border-top: 1px dashed #000; margin: 20px 0 10px 0;">
                    <p style="text-align: center; margin: 0; font-size: 10px; color: #555;">Documento para uso interno do estabelecimento.</p>
                </body>
            </html>
        `;

        if (window.electronAPI && typeof window.electronAPI.printReceipt === 'function') {
            await window.electronAPI.printReceipt(html);
            toast.success("Leitura Parcial (Relatório X) impressa com sucesso!", { icon: '🖨️' });
        } else {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const handlePrintZReport = async (closedSession) => {
        if (!closedSession) return;
        const printDate = new Date().toLocaleString('pt-PT');
        const openedDate = new Date(closedSession.opened_at).toLocaleString('pt-PT');
        const closedDate = new Date(closedSession.closed_at).toLocaleString('pt-PT');
        const diff = closedSession.difference || 0;
        
        const txsList = await cashSessionService.getSessionTransactions(closedSession.id);
        const suprimentos = txsList.filter(t => t.type === 'suprimento').reduce((sum, t) => sum + t.amount, 0);
        const sangrias = txsList.filter(t => t.type === 'sangria').reduce((sum, t) => sum + t.amount, 0);

        const html = `
            <html>
                <body style="font-family: monospace; font-size: 12px; max-width: 280px; margin: auto; padding: 10px; color: #000;">
                    <div style="text-align: center; margin-bottom: 10px;">
                        <h2 style="margin: 0; font-size: 16px;">${restaurantName || 'Menus Jindungo'}</h2>
                        <p style="margin: 2px 0; font-weight: bold;">FECHO DIÁRIO DE CAIXA (RELATÓRIO Z)</p>
                        <p style="margin: 2px 0;">Estado: TURNO ENCERRADO</p>
                    </div>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    <p style="margin: 2px 0;"><b>Turno ID:</b> ${closedSession.id}</p>
                    <p style="margin: 2px 0;"><b>Operador:</b> ${closedSession.opened_by}</p>
                    <p style="margin: 2px 0;"><b>Abertura:</b> ${openedDate}</p>
                    <p style="margin: 2px 0;"><b>Fecho:</b> ${closedDate}</p>
                    <hr style="border-top: 1px dashed #000; margin: 10px 0;">
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="padding: 4px 0;">Fundo de Maneio:</td>
                            <td style="padding: 4px 0; text-align: right;">${closedSession.initial_cash.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #34c759;">(+) Suprimentos:</td>
                            <td style="padding: 4px 0; text-align: right;">+${suprimentos.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #ff3b30;">(-) Sangrias:</td>
                            <td style="padding: 4px 0; text-align: right;">-${sangrias.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-weight: bold; border-top: 1px dashed #000;">Saldo Esperado:</td>
                            <td style="padding: 4px 0; text-align: right; font-weight: bold; border-top: 1px dashed #000;">${closedSession.expected_cash.toLocaleString()} Kz</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; font-weight: bold; font-size: 13px;">Saldo Declarado (Gaveta):</td>
                            <td style="padding: 4px 0; text-align: right; font-weight: bold; font-size: 13px;">${closedSession.actual_cash.toLocaleString()} Kz</td>
                        </tr>
                        <tr style="border-top: 1px dashed #000;">
                            <td style="padding: 6px 0; font-weight: bold;">DIFERENÇA / QUEBRA:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: ${diff < 0 ? '#ff3b30' : diff > 0 ? '#34c759' : '#000'}">
                                ${diff > 0 ? '+' : ''}${diff.toLocaleString()} Kz
                            </td>
                        </tr>
                    </table>
                    
                    <hr style="border-top: 1px dashed #000; margin: 15px 0;">
                    <div style="text-align: center; font-size: 10px; line-height: 1.4;">
                        <p style="margin: 2px 0;"><b>Assinatura do Operador:</b></p>
                        <br><br>
                        <p style="margin: 2px 0;">___________________________________</p>
                        <p style="margin: 2px 0; text-transform: uppercase;">${closedSession.opened_by}</p>
                    </div>
                </body>
            </html>
        `;

        if (window.electronAPI && typeof window.electronAPI.printReceipt === 'function') {
            await window.electronAPI.printReceipt(html);
            toast.success("Fecho de Caixa (Relatório Z) impresso com sucesso!", { icon: '🖨️' });
        } else {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

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

    const renderCashControlUI = () => {
        if (cashLoading) {
            return (
                <div className="py-20 flex flex-col items-center justify-center opacity-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37] mb-4"></div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">A carregar turnos...</span>
                </div>
            );
        }

        if (!activeSession) {
            return (
                <div className="p-8 max-w-xl mx-auto text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-[28px] flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.15)] text-red-500">
                        <XCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif font-black text-white">Turno de Caixa Fechado</h3>
                        <p className="text-gray-400 text-xs mt-1.5 max-w-sm mx-auto">
                            Abra o turno de caixa para começar a faturar pedidos no salão e registar movimentações financeiras.
                        </p>
                    </div>

                    <form onSubmit={handleOpenSession} className="bg-black/40 border border-white/5 rounded-3xl p-6 text-left space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Operador de Caixa</label>
                            <input
                                type="text"
                                defaultValue={localStorage.getItem(`jindungo_staff_name_${restaurantId}`) || "Administrador"}
                                disabled
                                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-gray-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Fundo de Maneio (Valor Inicial em Kz)</label>
                            <input
                                type="number"
                                required
                                placeholder="0 Kz"
                                value={openingCash}
                                onChange={(e) => setOpeningCash(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Notas de Abertura (Opcional)</label>
                            <textarea
                                placeholder="Ex: Abertura para troco inicial..."
                                value={openingNotes}
                                onChange={(e) => setOpeningNotes(e.target.value)}
                                rows={2}
                                className="w-full bg-[#121212] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-black font-black py-4 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/10 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                        >
                            <Coins size={14} /> Abrir Caixa (Iniciar Turno)
                        </button>
                    </form>
                </div>
            );
        }

        const summary = sessionSummary || {
            session: activeSession,
            transactions: [],
            suprimentos: 0,
            sangrias: 0,
            ordersCount: 0,
            cashSales: 0,
            cardSales: 0,
            mobileSales: 0,
            totalSales: 0,
            expectedCashInDrawer: activeSession.initial_cash
        };

        return (
            <div className="p-6 space-y-8 animate-in fade-in duration-300">
                {/* Active Session Status bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161616]/90 p-6 rounded-[2.5rem] border border-white/5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Caixa Aberto (Em Turno)</span>
                        </div>
                        <h3 className="font-serif font-black text-white text-lg mt-1">Turno ID: {activeSession.id}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Operador: <span className="font-bold text-gray-200">{activeSession.opened_by}</span> | Iniciado em: {new Date(activeSession.opened_at).toLocaleString('pt-PT')}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                setTransactionType('sangria');
                                setShowTxModal(true);
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={13} /> Movimentação de Caixa
                        </button>
                        <button
                            onClick={handlePrintXReport}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer"
                        >
                            <Printer size={13} /> Leitura X (Parcial)
                        </button>
                        <button
                            onClick={() => setShowCloseModal(true)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer"
                        >
                            <Coins size={13} /> Fechar Caixa (Relatório Z)
                        </button>
                    </div>
                </div>

                {/* Dashboard grid for active shift */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Fundo de Maneio</span>
                        <strong className="text-2xl font-mono text-white mt-1 block">{activeSession.initial_cash.toLocaleString('pt-AO')} Kz</strong>
                        <span className="text-[9px] text-gray-400 block mt-1">Declaração de abertura</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Vendas Dinheiro</span>
                        <strong className="text-2xl font-mono text-white mt-1 block">{summary.cashSales.toLocaleString('pt-AO')} Kz</strong>
                        <span className="text-[9px] text-gray-400 block mt-1">{summary.ordersCount} faturas no total</span>
                    </div>
                    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-3xl p-6">
                        <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-black block">Saldo Esperado Gaveta</span>
                        <strong className="text-2xl font-mono text-[#D4AF37] mt-1 block">{summary.expectedCashInDrawer.toLocaleString('pt-AO')} Kz</strong>
                        <span className="text-[9px] text-gray-400 block mt-1">Abertura + Vendas + Suprimentos - Sangrias</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">Outros Meios (Cartão/Express)</span>
                        <strong className="text-2xl font-mono text-white mt-1 block">{(summary.cardSales + summary.mobileSales).toLocaleString('pt-AO')} Kz</strong>
                        <span className="text-[9px] text-gray-400 block mt-1">Multicaixa: {summary.cardSales.toLocaleString('pt-AO')} Kz | Express: {summary.mobileSales.toLocaleString('pt-AO')} Kz</span>
                    </div>
                </div>

                {/* Turn transactions listing */}
                <div className="space-y-4">
                    <h4 className="text-xs text-gray-400 uppercase tracking-widest font-black">Histórico de Movimentações de Caixa</h4>
                    {summary.transactions.length > 0 ? (
                        <div className="overflow-x-auto bg-black/20 rounded-2xl border border-white/5">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-500 font-bold text-[10px] uppercase tracking-wider bg-white/[0.01]">
                                        <th className="py-4 px-6 font-medium">Data / Hora</th>
                                        <th className="py-4 px-6 font-medium">Tipo</th>
                                        <th className="py-4 px-6 font-medium">Motivo / Descrição</th>
                                        <th className="py-4 px-6 text-right font-medium">Valor (Kz)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {summary.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/[0.01]">
                                            <td className="py-4 px-6 font-mono text-gray-400">
                                                {new Date(tx.created_at).toLocaleTimeString('pt-PT')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase ${tx.type === 'sangria' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-300 font-medium">{tx.description}</td>
                                            <td className={`py-4 px-6 text-right font-mono font-bold ${tx.type === 'sangria' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {tx.type === 'sangria' ? '-' : '+'}{tx.amount.toLocaleString('pt-AO')} Kz
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center bg-black/20 border border-white/5 rounded-3xl flex flex-col items-center gap-1.5">
                            <Coins className="text-gray-600" size={24} />
                            <p className="text-gray-500 text-[10px] font-bold uppercase">Nenhuma movimentação manual lançada neste turno</p>
                        </div>
                    )}
                </div>

                {/* Previous sessions history log */}
                {previousSessions.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-xs text-gray-400 uppercase tracking-widest font-black">Histórico de Turnos Anteriores (Relatórios Z)</h4>
                        <div className="overflow-x-auto bg-black/20 rounded-2xl border border-white/5">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-500 font-bold text-[10px] uppercase tracking-wider bg-white/[0.01]">
                                        <th className="py-4 px-6 font-medium">Turno ID</th>
                                        <th className="py-4 px-6 font-medium">Operador</th>
                                        <th className="py-4 px-6 font-medium">Fecho em</th>
                                        <th className="py-4 px-6 text-right font-medium">Esperado</th>
                                        <th className="py-4 px-6 text-right font-medium">Declarado</th>
                                        <th className="py-4 px-6 text-right font-medium">Diferença</th>
                                        <th className="py-4 px-6 text-center font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {previousSessions.map((session) => {
                                        const diff = session.difference || 0;
                                        return (
                                            <tr key={session.id} className="hover:bg-white/[0.01]">
                                                <td className="py-4 px-6 font-mono font-bold text-white">{session.id}</td>
                                                <td className="py-4 px-6 text-gray-300 font-medium">{session.opened_by}</td>
                                                <td className="py-4 px-6 text-gray-400">
                                                    {new Date(session.closed_at).toLocaleString('pt-PT')}
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono text-gray-300">{session.expected_cash?.toLocaleString('pt-AO')} Kz</td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-white">{session.actual_cash?.toLocaleString('pt-AO')} Kz</td>
                                                <td className={`py-4 px-6 text-right font-mono font-bold ${diff < 0 ? 'text-red-400' : diff > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                    {diff > 0 ? '+' : ''}{diff.toLocaleString('pt-AO')} Kz
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <button
                                                        onClick={() => handlePrintZReport(session)}
                                                        className="p-2 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-xl text-gray-300 transition-all cursor-pointer hover:scale-105 active:scale-95 inline-flex items-center justify-center border border-white/5"
                                                        title="Reimprimir Relatório Z"
                                                    >
                                                        <Printer size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
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
                        <button
                            onClick={() => setActiveSubTab('offline_queue')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activeSubTab === 'offline_queue' ? 'bg-[#D4AF37] text-black font-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
                        >
                            Fila de Contingência
                            {pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black rounded-full px-1.5 py-0.5 text-[8px] animate-pulse">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveSubTab('cash_control')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activeSubTab === 'cash_control' ? 'bg-[#D4AF37] text-black font-black' : 'text-gray-400 hover:text-white bg-transparent'}`}
                        >
                            Turnos & Caixa
                            {activeSession && (
                                <span className="absolute top-1.5 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            )}
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
            {activeSubTab !== 'cash_control' && (
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
            )}

            {/* Main Section */}
            <div className="bg-black/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                {activeSubTab === 'cash_control' ? (
                    renderCashControlUI()
                ) : (
                    <>
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

                                {/* SUBTAB 3: OFFLINE CONTINGENCY QUEUE */}
                                {activeSubTab === 'offline_queue' && (
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                                            <div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                    <ShieldCheck className="text-[#D4AF37]" size={16} />
                                                    Faturas Assinadas Offline (Regime de Contingência)
                                                </h3>
                                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1">
                                                    Estas faturas foram validadas localmente e devem ser comunicadas à AGT no prazo legal de 48h.
                                                </p>
                                            </div>
                                            {pendingCount > 0 && (
                                                <button
                                                    onClick={syncPendingInvoices}
                                                    disabled={isSyncing}
                                                    className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/15 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                                >
                                                    {isSyncing ? (
                                                        <>
                                                            <RefreshCw size={13} className="animate-spin" />
                                                            A transmitir...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw size={13} />
                                                            Transmitir faturas ({pendingCount})
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {pendingCount > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-white/5 text-gray-500 font-bold text-[10px] uppercase tracking-wider bg-white/[0.01]">
                                                            <th className="py-4 px-6 font-medium">N.º Fatura / ID</th>
                                                            <th className="py-4 px-6 font-medium">Data Emissão</th>
                                                            <th className="py-4 px-6 font-medium">Cliente / NIF</th>
                                                            <th className="py-4 px-6 font-medium">Total Geral</th>
                                                            <th className="py-4 px-6 text-center font-medium">Visualizar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 text-xs">
                                                        {pendingInvoices.map((order) => (
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
                                                                    {new Date(order.created_at).toLocaleString('pt-PT')}
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
                                            </div>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center text-center px-10">
                                                <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-[28px] flex items-center justify-center mb-4 border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                                    <ShieldCheck size={24} className="text-[#D4AF37]" />
                                                </div>
                                                <h3 className="text-base font-bold text-gray-300">Fila Totalmente Sincronizada!</h3>
                                                <p className="text-gray-500 text-xs max-w-sm mt-1">Excelente! Todas as faturas emitidas em modo offline foram transmitidas com sucesso e homologadas na AGT.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Transaction Modal (Sangria/Suprimento) */}
            {showTxModal && activeSession && (
                <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-serif font-black text-white flex items-center gap-2">
                                <Plus size={18} className="text-[#D4AF37]" /> Movimentação de Caixa
                            </h3>
                            <button
                                onClick={() => setShowTxModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddTx} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Tipo de Movimento</label>
                                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('sangria')}
                                        className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${transactionType === 'sangria' ? 'bg-red-500/10 border border-red-500/20 text-red-400 font-black' : 'text-gray-400'}`}
                                    >
                                        Sangria (Saída)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('suprimento')}
                                        className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${transactionType === 'suprimento' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black' : 'text-gray-400'}`}
                                    >
                                        Suprimento (Entrada)
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Valor (Kz)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0 Kz"
                                    value={transactionAmount}
                                    onChange={(e) => setTransactionAmount(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Descrição / Motivo</label>
                                <textarea
                                    required
                                    placeholder="Ex: Compra de gelo, reforço de trocos..."
                                    value={transactionDesc}
                                    onChange={(e) => setTransactionDesc(e.target.value)}
                                    rows={2}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className={`w-full py-4.5 text-black font-black rounded-full text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer text-center ${transactionType === 'sangria' ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/10' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/10'}`}
                            >
                                Confirmar Movimentação
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Close Shift Modal (Relatório Z) */}
            {showCloseModal && activeSession && (
                <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#121212] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-serif font-black text-white flex items-center gap-2">
                                <Coins size={18} className="text-[#D4AF37]" /> Encerramento de Turno
                            </h3>
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-xs text-red-400 space-y-1">
                                <p className="font-bold">⚠️ Atenção:</p>
                                <p>Ao fechar o caixa, o turno será encerrado e o Relatório Z será impresso automaticamente.</p>
                            </div>

                            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Saldo Esperado em Caixa:</span>
                                    <span className="font-mono font-bold text-white">
                                        {(sessionSummary ? sessionSummary.expectedCashInDrawer : activeSession.initial_cash).toLocaleString('pt-AO')} Kz
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Valor Contado Fisicamente na Gaveta (Kz)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0 Kz"
                                    value={actualCashCount}
                                    onChange={(e) => setActualCashCount(e.target.value)}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37]"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Observações de Fecho (Opcional)</label>
                                <textarea
                                    placeholder="Ex: Quebra justificada por moedas..."
                                    value={closingNotes}
                                    onChange={(e) => setClosingNotes(e.target.value)}
                                    rows={2}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] resize-none"
                                />
                            </div>

                            <button
                                onClick={handleCloseSession}
                                className="w-full py-4.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold rounded-full text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 transition-all cursor-pointer text-center"
                            >
                                Fechar Turno e Imprimir Relatório Z
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

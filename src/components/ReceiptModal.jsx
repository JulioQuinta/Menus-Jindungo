import React, { useState, useRef, useEffect } from 'react';
import { Printer, Smartphone, FileText, X, ShieldCheck, Sparkles, Building2, User, Clock, Banknote, MapPin, Hash, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { billingService } from '../services/billingService';
import { supabase } from '../lib/supabaseClient';

const ReceiptModal = ({ isOpen, onClose, order, restaurantName = 'Jindungo Lounge & Grill' }) => {
    const [viewMode, setViewMode] = useState('receipt'); // 'receipt' (80mm) vs 'invoice' (A4)
    const [localOrder, setLocalOrder] = useState(order);
    const [dbRestaurant, setDbRestaurant] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const receiptRef = useRef(null);
    const invoiceRef = useRef(null);

    useEffect(() => {
        setLocalOrder(order);
    }, [order]);

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            const rId = localOrder?.restaurant_id || order?.restaurant_id;
            if (!rId) return;
            try {
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', rId)
                    .single();
                if (!error && data) {
                    setDbRestaurant(data);
                }
            } catch (err) {
                console.error("Error fetching restaurant details:", err);
            }
        };
        if (isOpen) {
            fetchRestaurantDetails();
        }
    }, [localOrder?.restaurant_id, order?.restaurant_id, isOpen]);

    useEffect(() => {
        if (!localOrder?.id || localOrder?.invoice_status !== 'pending_agt') return;

        console.log("Setting up polling for order invoice status:", localOrder.id);
        const interval = setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, restaurant:restaurants(*)')
                    .eq('id', localOrder.id)
                    .single();
                
                if (error) throw error;
                
                if (data && data.invoice_status !== 'pending_agt') {
                    console.log("Order invoice status updated to:", data.invoice_status);
                    setLocalOrder(data);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Error polling order invoice status:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [localOrder?.id, localOrder?.invoice_status]);

    const handleEmitirFatura = async () => {
        if (!localOrder?.id) return;
        setIsSubmitting(true);
        try {
            const res = await billingService.emitirFaturaEletronica(localOrder.id, localOrder.restaurant_id, localOrder);
            if (res.success) {
                setLocalOrder(prev => ({
                    ...prev,
                    invoice_status: 'pending_agt',
                    invoice_number: res.invoiceNumber,
                    request_id: res.requestId
                }));
            }
        } catch (err) {
            console.error("Error emitting invoice:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintReceipt = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Talao_Mesa_${localOrder?.id || '1042'}`,
    });

    const handlePrintInvoice = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: `Fatura_${localOrder?.id || '1042'}`,
    });

    if (!isOpen || !localOrder) return null;

    // Helper para formatar moeda em Kwanzas (Kz)
    const formatCurr = (val) => {
        return new Intl.NumberFormat('pt-AO').format(val || 0) + ' Kz';
    };

    // Helper para converter total num valor aproximado por extenso (ilustrativo para fatura)
    const numberToWords = (val) => {
        const num = Math.floor(val || 0);
        if (num === 0) return 'Zero Kwanzas';
        return `${new Intl.NumberFormat('pt-AO').format(num)} Kwanzas (Moeda Nacional)`;
    };

    const isDelivery = localOrder?.table_number?.includes('Entrega:') || localOrder?.order_type === 'delivery';
    const displayTable = (localOrder?.table_number || 'Mesa Principal').replace('Entrega: ', '');
    const orderDate = new Date(localOrder?.created_at || new Date().toISOString());
    const formattedDate = orderDate.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = orderDate.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });

    // Informações Fiscais do Restaurante
    const invoiceConfig = dbRestaurant?.invoice_config || localOrder?.restaurant?.invoice_config || {};
    const vatRate = typeof invoiceConfig.vat_rate === 'number' ? invoiceConfig.vat_rate : 14;
    const isExempt = vatRate === 0;

    // Informações da Empresa / Restaurante
    const companyInfo = {
        name: dbRestaurant?.name || restaurantName || 'Comidas da Terra',
        nif: invoiceConfig.nif || dbRestaurant?.nif || localOrder?.restaurant?.nif || '5417289301',
        address: invoiceConfig.address || dbRestaurant?.address || localOrder?.restaurant?.address || 'Av. Talatona, Edifício Jindungo, Luanda',
        phone: dbRestaurant?.phone || localOrder?.restaurant?.phone || '+244 923 456 789',
        email: dbRestaurant?.admin_email || localOrder?.restaurant?.admin_email || 'contato@jindungo.ao',
        certification_number: invoiceConfig.certification_number || '000/JINDUNGO',
        software_version: invoiceConfig.software_version || 'v3.1',
        layout_color: invoiceConfig.layout_color || '#D4AF37',
        show_logo: invoiceConfig.show_logo !== false,
        invoice_footer_note: invoiceConfig.invoice_footer_note || (isExempt ? `Isento nos termos do Código do IVA (${invoiceConfig.exemption_code || 'M10'})` : 'Regime Geral de Faturação')
    };

    // Informações do Cliente
    const customerInfo = {
        name: localOrder?.customer_name || 'Consumidor Final',
        phone: localOrder?.customer_phone || 'Não informado',
        nif: localOrder?.customer_nif || '999999999',
        address: isDelivery ? (localOrder?.delivery_address || displayTable) : displayTable
    };

    // Cálculo Financeiro Discriminado (IVA / Impostos / Descontos)
    const rawTotal = localOrder?.total || 12450;
    const discount = localOrder?.coupon_discount || 0;
    const subtotal = rawTotal + discount;
    const taxRate = vatRate / 100;
    const taxAmount = isExempt ? 0 : Math.round(rawTotal - (rawTotal / (1 + taxRate)));
    const netSubtotal = rawTotal - taxAmount;

    const handleWhatsAppShare = () => {
        let msg = `🧾 *${companyInfo.name}* - Resumo da Conta\n\n`;
        msg += `Pedido N.º: #${localOrder?.id ? localOrder.id.slice(0, 6) : '1042'}\n`;
        msg += `Data: ${formattedDate} às ${formattedTime}\n`;
        msg += `Cliente: ${customerInfo.name}\n`;
        msg += `Local: ${displayTable}\n\n`;
        msg += `*ITENS CONSUMIDOS:*\n`;
        localOrder?.items?.forEach(item => {
            msg += `• ${item.quantity}x ${item.name} - ${formatCurr(item.price * item.quantity)}\n`;
        });
        if (discount > 0) {
            msg += `\nDesconto: -${formatCurr(discount)}`;
        }
        msg += `\n\n*TOTAL GERAL: ${formatCurr(rawTotal)}* 💰\n\n`;
        msg += `Obrigado pela preferência! Verifique a ementa digital e novidades em https://jindungo.ao`;

        const phone = (customerInfo.phone !== 'Não informado' ? customerInfo.phone : '').replace(/\D/g, '');
        const targetUrl = phone ? `https://wa.me/244${phone}?text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(targetUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans">
            <div className="bg-[#121212] border border-[#2A2A2A] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden">
                
                {/* CABEÇALHO DO MODAL E SELETOR DE MODO */}
                <div className="bg-[#181818] p-4 sm:px-6 sm:py-4 border-b border-[#2A2A2A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-500 flex items-center justify-center text-black shadow-lg shadow-[#D4AF37]/20 shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2 truncate">
                                    Faturação
                                    <span className="text-[10px] font-sans font-black tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 uppercase shrink-0">Premium</span>
                                </h3>
                                <p className="text-xs text-gray-400 hidden sm:block">Escolha o formato ideal para impressão ou envio digital</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white flex sm:hidden items-center justify-center border border-white/20 transition-all cursor-pointer active:scale-95 ml-2 shrink-0 shadow-lg"
                            title="Fechar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <div className="bg-[#121212] p-1 rounded-2xl border border-white/10 flex gap-1 w-full sm:w-auto">
                            <button
                                onClick={() => setViewMode('receipt')}
                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    viewMode === 'receipt'
                                        ? 'bg-[#D4AF37] text-black shadow-md font-black'
                                        : 'text-gray-400 hover:text-white bg-white/5'
                                }`}
                            >
                                <FileText size={14} /> Talão 80mm
                            </button>
                            <button
                                onClick={() => setViewMode('invoice')}
                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    viewMode === 'invoice'
                                        ? 'bg-[#D4AF37] text-black shadow-md font-black'
                                        : 'text-gray-400 hover:text-white bg-white/5'
                                }`}
                            >
                                <Building2 size={14} /> Fatura A4
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white hidden sm:flex items-center justify-center border border-white/20 transition-all cursor-pointer active:scale-95 shrink-0 shadow-lg"
                            title="Fechar"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* CORPO CENTRAL DO MODAL COM PREVIEW */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center bg-[#0C0C0C]">
                    
                    {/* Banners de Status de Faturação Eletrónica */}
                    {localOrder?.invoice_status === 'pending_agt' && (
                        <div className="w-full max-w-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-pulse">
                            <RefreshCw className="animate-spin shrink-0" size={18} />
                            <div className="text-xs">
                                <strong>Fatura em processamento na AGT...</strong>
                                <p className="opacity-80 mt-0.5">O lote foi assinado via JWS e enviado com o Ticket ID {localOrder.request_id}. O status será validado em instantes.</p>
                            </div>
                        </div>
                    )}

                    {localOrder?.invoice_status === 'rejected' && (
                        <div className="w-full max-w-2xl bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3">
                            <AlertTriangle className="shrink-0" size={18} />
                            <div className="text-xs">
                                <strong>Fatura rejeitada pela AGT</strong>
                                <p className="opacity-80 mt-0.5">Ocorreu um erro de validação fiscal no Web Service da AGT. Verifique os dados de NIF e tente re-emitir.</p>
                            </div>
                        </div>
                    )}

                    {localOrder?.invoice_status === 'validated' && (
                        <div className="w-full max-w-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl mb-6 flex items-center gap-3">
                            <CheckCircle2 className="shrink-0 text-emerald-500" size={18} />
                            <div className="text-xs">
                                <strong>Documento Fiscal Homologado</strong>
                                <p className="opacity-80 mt-0.5">A fatura {localOrder.invoice_number} foi validada com sucesso e a assinatura digital JWS foi arquivada.</p>
                            </div>
                        </div>
                    )}

                    <div className={viewMode === 'receipt' ? 'block w-full max-w-[340px]' : 'hidden'}>
                        <div 
                            ref={receiptRef} 
                            className="bg-[#FDFCFA] text-[#111111] font-mono text-[10px] p-4 shadow-2xl relative mx-auto"
                            style={{ width: '290px', minHeight: 'auto', boxSizing: 'border-box' }}
                        >
                            {/* Efeito de Corte Serrilhado no Topo */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(ellipse_at_top,_#0C0C0C_50%,_transparent_50%)] bg-[length:10px_10px] bg-repeat-x"></div>

                            {/* Cabeçalho do Talão */}
                            <div className="text-center pt-1.5 pb-2 border-b border-dashed border-gray-300">
                                <div className="text-2xl font-serif text-[#C5A059] mb-0.5 font-bold">Ψ ϼ</div>
                                <h1 className="text-base font-black font-sans tracking-tight text-black leading-tight uppercase">
                                    {companyInfo.name}
                                </h1>
                                <p className="text-[10px] text-gray-600 mt-1">{companyInfo.address}</p>
                                <p className="text-[10px] text-gray-600">NIF: {companyInfo.nif} | Tel: {companyInfo.phone}</p>
                                
                                <div className="mt-3 inline-block bg-[#111] text-[#F5C542] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    {localOrder.invoice_status === 'validated' 
                                        ? (localOrder.invoice_number?.includes('FR') ? 'FATURA-RECIBO' : 'FATURA SIMPLIFICADA') 
                                        : 'CONTA DE MESA / CONFERÊNCIA'}
                                </div>
                                {localOrder.invoice_status === 'validated' && (
                                    <div className="text-[10px] font-mono font-black mt-1.5 text-black tracking-tight">
                                        {localOrder.invoice_number}
                                    </div>
                                )}
                            </div>

                            {/* Metadados do Pedido */}
                            <div className="py-2 border-b border-dashed border-gray-300 space-y-0.5 text-[10px] text-gray-800">
                                <div className="flex justify-between">
                                    <span>Mesa / Local:</span>
                                    <strong className="text-black font-bold">{displayTable}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>N.º Encomenda:</span>
                                    <strong className="text-black font-mono font-bold">#{order?.id ? order.id.slice(0, 6) : '1042'}</strong>
                                </div>
                                {localOrder.invoice_status === 'validated' && (
                                    <div className="flex justify-between">
                                        <span>Cód. Validação AGT:</span>
                                        <strong className="text-black font-mono text-[9px] truncate max-w-[170px]">{localOrder.validation_code}</strong>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Data e Hora:</span>
                                    <span>{formattedDate} - {formattedTime}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cliente:</span>
                                    <span className="truncate max-w-[180px] font-bold text-black">{customerInfo.name} ({customerInfo.nif})</span>
                                </div>
                            </div>

                            {/* Lista de Itens */}
                            <div className="py-2 border-b border-dashed border-gray-300">
                                <div className="flex justify-between font-bold text-black pb-1.5 mb-1.5 border-b border-gray-200 uppercase text-[10px] tracking-wider">
                                    <span className="w-8">Qtd</span>
                                    <span className="flex-1 text-left">Descrição</span>
                                    <span className="w-20 text-right">Total (Kz)</span>
                                </div>

                                <div className="space-y-1">
                                    {order?.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-start justify-between text-black text-[10px] leading-tight">
                                            <span className="w-8 font-bold text-gray-900">{item.quantity}x</span>
                                            <div className="flex-1 text-left pr-2">
                                                <span className="font-bold block">{item.name}</span>
                                                {item.variant_name && <span className="text-[9px] text-gray-500 block">↳ {item.variant_name}</span>}
                                            </div>
                                            <span className="w-20 text-right font-mono font-bold">
                                                {new Intl.NumberFormat('pt-AO').format(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Seção de Totais e Descontos */}
                            <div className="py-2 border-b border-dashed border-gray-300 space-y-1 text-gray-800">
                                <div className="flex justify-between text-xs font-bold text-black pt-1">
                                    <span>SUBTOTAL CONSUMO:</span>
                                    <span className="font-mono">{formatCurr(subtotal)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-green-700">
                                        <span>DESCONTO CUPÃO:</span>
                                        <span className="font-mono">-{formatCurr(discount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-[11px] text-gray-600">
                                    <span>IVA Incluso ({vatRate}%):</span>
                                    <span className="font-mono">{formatCurr(taxAmount)}</span>
                                </div>

                                <div className="my-1.5 border-t border-b border-black py-1.5 flex justify-between items-baseline bg-gray-50 p-1.5 rounded">
                                    <span className="text-xs font-black text-black">TOTAL A PAGAR:</span>
                                    <span className="text-base font-black font-mono text-black">{formatCurr(rawTotal)}</span>
                                </div>

                                <div className="flex justify-between text-[9px] text-gray-600 pt-0.5">
                                    <span>Modo de Pagamento:</span>
                                    <span className="font-bold text-black uppercase">
                                        {order?.payment_method === 'multicaixa' ? 'Multicaixa Express' : order?.payment_method === 'cash' ? 'Numerário' : (order?.payment_method || 'A Confirmar')}
                                    </span>
                                </div>
                            </div>

                            {/* Rodapé e QR Code de Avaliação */}
                            <div className="text-center pt-2 pb-1">
                                <div className="flex justify-center mb-1.5">
                                    <div className="p-1.5 bg-white border border-gray-200 rounded-lg inline-block shadow-sm">
                                        <QRCodeSVG value={localOrder.invoice_status === 'validated'
                                            ? `https://agt.minfin.gov.ao/valida/fatura?nif=${companyInfo.nif}&num=${localOrder.invoice_number}`
                                            : `https://jindungo.ao/valida/${order?.id || '1042'}`} size={64} />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-black mb-0.5">Avalie a sua experiência</p>

                                <div className="mt-2 pt-2 border-t border-gray-200 text-[8px] text-gray-500 uppercase tracking-widest space-y-0.5">
                                    {localOrder.invoice_status === 'validated' ? (
                                        <>
                                            <p className="font-bold text-emerald-700">Este documento serve de Fatura</p>
                                            <p className="font-bold text-gray-700">Software Certificado n.º {companyInfo.certification_number}/AGT</p>
                                            <p className="text-[8px] lowercase font-mono">Assinatura JWS: {localOrder.jws_hash?.slice(-20)}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-red-600">Este documento não serve de Fatura</p>
                                            <p className="font-bold text-gray-700">Software Certificado n.º {companyInfo.certification_number}/AGT</p>
                                        </>
                                    )}
                                    <p>Processado por Sistema Jindungo POS {companyInfo.software_version}</p>
                                    <p className="text-[8px] text-gray-400 capitalize">Produzido por SUMBA AQUI - Comércio e Serviços (SU), Lda. (Edifício y-18, Centralidade do Kilamba)</p>
                                </div>
                            </div>

                            {/* Efeito de Corte Serrilhado no Fundo */}
                            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(ellipse_at_bottom,_#0C0C0C_50%,_transparent_50%)] bg-[length:10px_10px] bg-repeat-x"></div>
                        </div>
                    </div>

                    {/* MODO 2: FATURA COMERCIAL FISCAL (A4) */}
                    <div className={viewMode === 'invoice' ? 'block w-full max-w-2xl' : 'hidden'}>
                        <div 
                            ref={invoiceRef} 
                            className="bg-white text-gray-900 font-sans p-8 sm:p-12 shadow-2xl rounded-xl relative mx-auto"
                            style={{ minHeight: '800px', boxSizing: 'border-box' }}
                        >
                            {/* Faixa Superior Noir & Gold */}
                            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#111] via-[#D4AF37] to-[#111] rounded-t-xl"></div>

                            {/* Cabeçalho da Fatura (Dados Empresa e Título) */}
                            <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-gray-200 mt-2 gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-4xl font-serif text-[#D4AF37] font-bold">Ψ ϼ</span>
                                        <div>
                                            <h1 className="text-2xl font-serif font-black tracking-tight text-gray-950 uppercase leading-none">
                                                {companyInfo.name}
                                            </h1>
                                            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mt-1">Lounge & Fine Dining</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-0.5 mt-3 font-medium">
                                        <p>{companyInfo.address}</p>
                                        <p>NIF: <strong className="text-gray-900">{companyInfo.nif}</strong></p>
                                        <p>Telefone: {companyInfo.phone} | E-mail: {companyInfo.email}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                        {localOrder.invoice_number?.includes('FR') ? 'Fatura-Recibo' : (localOrder.invoice_number?.includes('FS') ? 'Fatura Simplificada' : 'Consulta de Mesa')}
                                    </span>
                                    <h2 className="text-xl font-mono font-black text-gray-900">
                                        {localOrder.invoice_number || 'Sem Série (Rascunho)'}
                                    </h2>
                                    <div className="text-xs text-gray-600 space-y-0.5 mt-2 font-medium">
                                        <p>Data Emissão: <strong className="text-gray-900">{formattedDate}</strong></p>
                                        <p>Hora de Fecho: <strong className="text-gray-900">{formattedTime}</strong></p>
                                        <p>Local de Consumo: <strong className="text-gray-900">{displayTable}</strong></p>
                                    </div>
                                </div>
                            </div>

                            {/* Dados do Cliente e Operação */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-gray-200">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <User size={14} className="text-[#D4AF37]" /> DADOS DO ADQUIRENTE (CLIENTE)
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-1 text-gray-700">
                                        <p className="text-sm font-bold text-gray-950 truncate">{customerInfo.name}</p>
                                        <p>NIF / Contribuinte: <strong className="text-gray-950 font-mono">{customerInfo.nif}</strong></p>
                                        <p>Morada: {customerInfo.address}</p>
                                        <p>Contacto: {customerInfo.phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-[#D4AF37]" /> DETALHES DA TRANSAÇÃO
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-1.5 text-gray-700">
                                        <div className="flex justify-between">
                                            <span>Condição de Pagamento:</span>
                                            <strong className="text-gray-950 uppercase">{order?.payment_method || 'Pronto Pagamento'}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Moeda Oficial:</span>
                                            <strong className="text-gray-950">Kwanzas (AOA)</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Regime Fiscal:</span>
                                            <strong className="text-gray-950">Geral (IVA 14%)</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estafeta / Garçom:</span>
                                            <strong className="text-gray-950">{order?.courier_name || 'Serviço de Sala'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela de Produtos / Serviços */}
                            <div className="py-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    DISCRIMINAÇÃO DE BENS E SERVIÇOS
                                </h3>

                                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 w-12 text-center">Item</th>
                                                <th className="p-3">Descrição do Artigo</th>
                                                <th className="p-3 text-center w-16">Qtd</th>
                                                <th className="p-3 text-right w-24">Preço Unit.</th>
                                                <th className="p-3 text-center w-20">Taxa IVA</th>
                                                <th className="p-3 text-right w-28 font-black">Total Ilíquido</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 font-medium">
                                            {order?.items?.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="p-3 text-center font-mono text-gray-500">{idx + 1}</td>
                                                    <td className="p-3 font-bold text-gray-900">
                                                        <div>{item.name}</div>
                                                        {item.variant_name && <div className="text-[10px] text-gray-500 font-normal">↳ {item.variant_name}</div>}
                                                    </td>
                                                    <td className="p-3 text-center font-mono font-bold text-gray-900">{item.quantity}</td>
                                                    <td className="p-3 text-right font-mono text-gray-700">{formatCurr(item.price)}</td>
                                                    <td className="p-3 text-center text-gray-600 font-mono">14%</td>
                                                    <td className="p-3 text-right font-mono font-bold text-gray-950">{formatCurr(item.price * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Seção Resumo Financeiro & Totais Finais */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 py-6 border-t border-b border-gray-200">
                                <div className="sm:col-span-7 space-y-3">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Total por Extenso:</span>
                                        <p className="text-xs bg-amber-500/10 text-amber-900 border border-amber-500/20 p-3 rounded-xl font-serif italic font-bold">
                                            "{numberToWords(rawTotal)}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <QRCodeSVG 
                                                value={localOrder.invoice_status === 'validated' 
                                                    ? `https://agt.minfin.gov.ao/valida/fatura?nif=${companyInfo.nif}&num=${localOrder.invoice_number}`
                                                    : `https://jindungo.ao/fatura/rascunho/${localOrder.id}`
                                                } 
                                                size={56} 
                                            />
                                        </div>
                                        <div className="text-[11px] text-gray-600">
                                            <strong className="text-gray-900 block mb-0.5 font-bold">
                                                {localOrder.invoice_status === 'validated' ? 'Autenticação Digital AGT' : 'Rascunho Sem Efeito Fiscal'}
                                            </strong>
                                            <span className="block font-mono text-[10px] break-all leading-tight mt-1 text-gray-500">
                                                {localOrder.invoice_status === 'validated' 
                                                    ? `Código Hash: ${localOrder.validation_code}` 
                                                    : (localOrder.invoice_status === 'pending_agt' 
                                                        ? 'A processar validação...' 
                                                        : 'Fatura não comunicada à AGT')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="sm:col-span-5 flex flex-col justify-end">
                                    <div className="flex justify-between text-gray-600 p-1">
                                        <span>Subtotal de Bens:</span>
                                        <strong className="font-mono text-gray-900">{formatCurr(netSubtotal)}</strong>
                                    </div>
                                    <div className="flex justify-between text-gray-600 p-1">
                                        <span>Total Impostos (IVA {vatRate}%):</span>
                                        <strong className="font-mono text-gray-900">{formatCurr(taxAmount)}</strong>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-700 p-1 font-bold bg-green-50 rounded-lg">
                                            <span>Descontos Comerciais:</span>
                                            <strong className="font-mono">-{formatCurr(discount)}</strong>
                                        </div>
                                    )}
                                    <div className="bg-[#111] text-white p-4 rounded-2xl flex items-baseline justify-between shadow-xl mt-3">
                                        <div>
                                            <span className="text-[10px] text-[#D4AF37] uppercase font-black tracking-widest block">Total Líquido</span>
                                            <span className="text-[10px] text-gray-400">A Pagar / Pago</span>
                                        </div>
                                        <span className="text-2xl font-black font-mono text-[#D4AF37]">
                                            {formatCurr(rawTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Rodapé Fiscal da Fatura */}
                            <div className="pt-8 text-center text-[11px] text-gray-500 space-y-1">
                                <div className="flex items-center justify-center gap-2 text-gray-700 font-bold mb-2">
                                    <CheckCircle2 size={15} className="text-emerald-600" />
                                    <span>Documento emitido com sucesso nos termos do {companyInfo.invoice_footer_note}</span>
                                </div>
                                <p>Regime Jurídico das Faturas - Decreto Presidencial n.º 149/20</p>
                                <p className="font-bold text-gray-800">Software Certificado AGT n.º {companyInfo.certification_number} - Menús Jindungos Comercial</p>
                                <p className="text-[8px] text-gray-400 capitalize">Produzido por SUMBA AQUI - Comércio e Serviços (SU), Lda. (Edifício y-18, Centralidade do Kilamba)</p>
                                <p className="text-[10px] text-gray-400 mt-2 font-mono">ID de Transação Supabase: {order?.id || '1042-8931'} | Versão {companyInfo.software_version}</p>
                            </div>

                        </div>
                    </div>

                </div>

                {/* RODAPÉ DO MODAL E BOTÕES DE AÇÃO */}
                <div className="bg-[#181818] px-6 py-4 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-green-500" />
                        <span>Formatado com normas fiscais da AGT Angola e layout premium</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border border-zinc-700 cursor-pointer active:scale-95 flex items-center gap-1.5"
                        >
                            <X size={15} /> Fechar
                        </button>

                        <button
                            onClick={handleWhatsAppShare}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 cursor-pointer"
                        >
                            <Smartphone size={15} /> Partilhar WhatsApp
                        </button>

                        {(localOrder.invoice_status === 'draft' || localOrder.invoice_status === 'rejected' || !localOrder.invoice_status) ? (
                            <>
                                <button
                                    onClick={handleEmitirFatura}
                                    disabled={isSubmitting}
                                    className="bg-[#D4AF37] hover:bg-[#C5A059] text-black px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95 cursor-pointer uppercase tracking-wider"
                                >
                                    <Sparkles size={15} /> {isSubmitting ? 'A comunicar...' : 'Emitir Fatura Eletrónica'}
                                </button>
                                <button
                                    onClick={viewMode === 'receipt' ? handlePrintReceipt : handlePrintInvoice}
                                    className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer uppercase tracking-wider"
                                    title="Imprimir Rascunho de Consulta"
                                >
                                    <Printer size={15} /> Imprimir Rascunho
                                </button>
                            </>
                        ) : localOrder.invoice_status === 'pending_agt' ? (
                            <button
                                disabled
                                className="bg-gray-700 text-gray-400 px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-not-allowed uppercase tracking-wider"
                            >
                                <RefreshCw size={15} className="animate-spin" /> A validar na AGT...
                            </button>
                        ) : (
                            <button
                                onClick={viewMode === 'receipt' ? handlePrintReceipt : handlePrintInvoice}
                                className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-black px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95 cursor-pointer uppercase tracking-wider"
                            >
                                <Printer size={15} /> {viewMode === 'receipt' ? 'Imprimir Talão Térmico' : 'Imprimir Fatura A4'}
                            </button>
                        )}
                    </div>
            </div>
        </div>
    </div>
);
};

export default ReceiptModal;

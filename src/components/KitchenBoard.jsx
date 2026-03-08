import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { Clock, CheckCircle, ChefHat, Truck, XCircle, AlertCircle, Banknote, Printer } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TableBillTemplate from './TableBillTemplate';

const OrderCard = ({ order, onStatusChange, onPrint, enablePrint }) => {
    // Calculate waiting time
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const diff = Date.now() - new Date(order.created_at).getTime();
            const minutes = Math.floor(diff / 60000);
            setElapsed(`${minutes} min`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [order.created_at]);

    const statusColors = {
        pending: 'border-[#F1C40F] bg-black/40 shadow-[0_5px_20px_rgba(241,196,15,0.1)]',
        preparing: 'border-[#E67E22] bg-black/40 shadow-[0_5px_20px_rgba(230,126,34,0.1)]',
        ready: 'border-[#2ECC71] bg-black/40 shadow-[0_5px_20px_rgba(46,204,113,0.1)]',
    };

    return (
        <div className={`p-5 rounded-2xl border-l-4 backdrop-blur-md mb-4 animate-slide-in transition-all hover:scale-[1.02] hover:-translate-y-1 ${statusColors[order.status] || 'border-white/10 bg-black/40'} border-y border-y-white/5 border-r border-r-white/5`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="font-bold text-lg text-white leading-tight">#{order.table_number.includes("Entrega") ? '🛵' : 'Mesa'} {order.table_number.replace('Entrega: ', '')}</h4>
                    <span className="text-sm text-gray-400 font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
                    <Clock size={12} className={order.status === 'pending' && parseInt(elapsed) > 15 ? 'text-red-400 animate-pulse' : 'text-[#D4AF37]'} />
                    {elapsed}
                </div>
            </div>

            {/* Payment Info */}
            {order.table_number.includes('| Pgto:') && (
                <div className="mb-3 text-xs font-semibold text-gray-300 bg-green-900/20 p-2 rounded-lg border border-green-500/20 flex items-center gap-2">
                    <span className="flex h-2 w-2 relative mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                    <Banknote size={14} className="text-green-400" />
                    {order.table_number.split('| Pgto:')[1]?.trim()}
                </div>
            )}

            <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 mb-2 last:mb-0 last:pb-0">
                        <span className="font-semibold text-gray-300">
                            <span className="bg-white/10 text-[#D4AF37] font-bold px-2 py-0.5 rounded-md mr-3 text-xs shadow-sm border border-white/5">{item.quantity}</span>
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
                {order.status === 'pending' && (
                    <button
                        onClick={() => onStatusChange(order.id, 'preparing')}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/25"
                    >
                        <ChefHat size={16} /> Preparar
                    </button>
                )}

                {order.status === 'preparing' && (
                    <button
                        onClick={() => onStatusChange(order.id, 'ready')}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-green-500/25"
                    >
                        <CheckCircle size={16} /> Pronto
                    </button>
                )}

                {order.status === 'ready' && (
                    <>
                        <button
                            onClick={() => onStatusChange(order.id, 'delivered')}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all border border-white/10 hover:border-white/30"
                        >
                            <Truck size={16} /> Entregue
                        </button>
                        <button
                            onClick={() => { if (window.confirm('Recebeu o pagamento e deseja fechar esta conta?')) onStatusChange(order.id, 'paid'); }}
                            className="flex-1 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:brightness-110 text-black py-2.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-yellow-500/25"
                        >
                            <Banknote size={16} /> Pago
                        </button>
                    </>
                )}

                {/* Print Button (Optional via Settings) */}
                {enablePrint && (
                    <button
                        onClick={() => onPrint(order)}
                        className="p-2.5 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors border border-white/5 hover:border-white/20 ml-1"
                        title="Imprimir Conta de Conferência"
                    >
                        <Printer size={18} />
                    </button>
                )}

                {order.status === 'pending' && (
                    <button
                        onClick={() => { if (window.confirm('Cancelar este pedido?')) onStatusChange(order.id, 'cancelled'); }}
                        className="p-2.5 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-colors border border-transparent hover:border-red-500/30 ml-1"
                        title="Cancelar"
                    >
                        <XCircle size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

const KitchenBoard = ({ restaurantId, config, restaurantName }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Native Printing State
    const [printingOrder, setPrintingOrder] = useState(null);

    const handlePrintOrder = (order) => {
        setPrintingOrder(order);
        // Wait for state to update and React to render the printable area
        setTimeout(() => {
            window.print();
        }, 100);
    };

    useEffect(() => {
        if (!restaurantId) return;

        // 1. Initial Load
        const loadOrders = async () => {
            const { data } = await orderService.getActiveOrders(restaurantId);
            setOrders(data);
            setLoading(false);
        };
        loadOrders();

        // 2. Realtime Subscription
        const channel = orderService.subscribeToOrders(restaurantId, (payload) => {
            if (payload.eventType === 'INSERT') {
                // Play Sound Safely
                try {
                    const audio = new Audio('/bell.mp3'); // Local bell
                    audio.play().catch(e => console.log('Audio blocked', e));
                } catch (err) {
                    console.log('Audio error', err);
                }

                setOrders(prev => [...prev, payload.new]);
            } else if (payload.eventType === 'UPDATE') {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
            }
        });

        return () => {
            // Cleanup handled by service implicitly or we should explicit unsubscribe
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const handleStatusUpdate = async (id, status) => {
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

        // API Call
        await orderService.updateOrderStatus(id, status);

        // Remove from list if delivered/cancelled after animation? 
        // For now we keep them until refresh or filter logic if needed, but getActiveOrders filters them.
        if (status === 'delivered' || status === 'cancelled' || status === 'paid') {
            setTimeout(() => {
                setOrders(prev => prev.filter(o => o.id !== id));
            }, 500); // Wait for visual feedback
        }
    };

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    if (loading) return <div className="p-8 text-gray-500">Carregando pedidos...</div>;

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 bg-transparent overflow-hidden relative">

            {/* Global Print Styles to hide the rest of the UI and only show the print container */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #print-container, #print-container * {
                            visibility: visible;
                        }
                        #print-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 0;
                            margin: 0;
                        }
                        @page { margin: 0; }
                    }
                `}
            </style>

            {/* Print Container: Only rendered when there is an order to print */}
            {printingOrder && (
                <div id="print-container" className="absolute top-0 left-0 w-full z-[-1] opacity-0 pointer-events-none print:opacity-100 print:z-50 print:relative print:w-[80mm]">
                    <TableBillTemplate
                        order={printingOrder}
                        restaurantName={restaurantName || printingOrder?.restaurant?.name || 'Jindungo'}
                    />
                </div>
            )}

            {orders.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <ChefHat size={48} className="mb-4 opacity-50" />
                    <p>Nenhum pedido ativo no momento.</p>
                </div>
            )}

            {orders.length > 0 && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0 overflow-x-auto pb-2 px-2">
                    {/* Column 1: Pendentes */}
                    <div className="bg-black/60 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-3xl p-5 flex flex-col h-full min-h-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between mb-4 z-10">
                            <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-wider text-xs">
                                <AlertCircle size={16} />
                                Pendentes
                            </div>
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-yellow-500/20">{pendingOrders.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                            {pendingOrders.map(order => (
                                <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} />
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Preparando */}
                    <div className="bg-black/60 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-3xl p-5 flex flex-col h-full min-h-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between mb-4 z-10">
                            <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-wider text-xs">
                                <ChefHat size={16} />
                                Em Preparação
                            </div>
                            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-500/20">{preparingOrders.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                            {preparingOrders.map(order => (
                                <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} />
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Prontos */}
                    <div className="bg-black/60 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl rounded-3xl p-5 flex flex-col h-full min-h-0 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all duration-700"></div>
                        <div className="flex items-center justify-between mb-4 z-10">
                            <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-wider text-xs">
                                <CheckCircle size={16} />
                                Prontos p/ Servir
                            </div>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-500/20">{readyOrders.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pt-1 custom-scrollbar z-10">
                            {readyOrders.map(order => (
                                <OrderCard key={order.id} order={order} onStatusChange={handleStatusUpdate} onPrint={handlePrintOrder} enablePrint={config?.enableTableBill !== false} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KitchenBoard;

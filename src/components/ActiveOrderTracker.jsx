import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, Loader, AlertCircle } from 'lucide-react';
import OrderStatusView from './OrderStatusView';

const ActiveOrderTracker = ({ restaurantId, whatsappNumber }) => {
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [orderInfo, setOrderInfo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial check
    useEffect(() => {
        if (!restaurantId) return;

        const checkActiveOrder = () => {
            const saved = localStorage.getItem(`jindungo_active_order_${restaurantId}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Expire after 12 hours just in case
                    if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
                        setActiveOrderId(parsed.id);
                        fetchOrderStatus(parsed.id);
                    } else {
                        localStorage.removeItem(`jindungo_active_order_${restaurantId}`);
                    }
                } catch (e) {
                    console.error("Error parsing order", e);
                }
            }
        };

        checkActiveOrder();

        // Listen to storage events or custom events if order is placed via CheckoutModal
        const interval = setInterval(checkActiveOrder, 5000); // Polling localstorage backup
        
        window.addEventListener('jindungo_new_order', checkActiveOrder);
        return () => {
            clearInterval(interval);
            window.removeEventListener('jindungo_new_order', checkActiveOrder);
        };
    }, [restaurantId]);

    const fetchOrderStatus = async (id) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            if (data) {
                setOrderInfo(data);
                if (data.status === 'delivered' || data.status === 'cancelled') {
                    // It's finished. We can keep it to show rating, then user closes it.
                }
            } else {
                // If not found, clear it
                clearTracker();
            }
        } catch (err) {
            console.error("Error fetching active order:", err);
        } finally {
            setLoading(false);
        }
    };

    // Real-time subscription to order status
    useEffect(() => {
        if (!activeOrderId || !restaurantId) return;

        const channel = supabase
            .channel(`public:orders:id=eq.${activeOrderId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeOrderId}` },
                (payload) => {
                    setOrderInfo(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeOrderId, restaurantId]);

    const clearTracker = () => {
        localStorage.removeItem(`jindungo_active_order_${restaurantId}`);
        setActiveOrderId(null);
        setOrderInfo(null);
        setIsModalOpen(false);
    };

    if (!activeOrderId || !orderInfo) return null;

    // Determine colors based on status
    const isFinished = orderInfo.status === 'delivered' || orderInfo.status === 'cancelled';
    const statusColor = {
        pending: 'bg-yellow-500',
        preparing: 'bg-orange-500',
        ready: 'bg-green-500',
        delivered: 'bg-blue-500',
        cancelled: 'bg-red-500',
    }[orderInfo.status] || 'bg-gray-500';

    return (
        <>
            {/* The Floating Widget on PublicMenu */}
            <div 
                className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9000] bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-full px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:scale-[1.02] transition-all animate-in slide-in-from-top-10 duration-500 w-[90%] sm:w-80 overflow-hidden ring-4 ring-white/50`}
                onClick={() => setIsModalOpen(true)}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                
                <div className="flex items-center gap-3 relative z-10 w-full overflow-hidden">
                    <div className="relative">
                        {!isFinished && <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${statusColor}`} />}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${statusColor}`}>
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 truncate">O seu Pedido do Menu</p>
                        <p className="text-sm font-black text-gray-900 truncate flex items-center gap-1.5">
                            {orderInfo.status === 'pending' && "Aguardando Confirmação"}
                            {orderInfo.status === 'preparing' && "Em Preparação na Cozinha!"}
                            {orderInfo.status === 'ready' && "Pronto para Si!"}
                            {orderInfo.status === 'delivered' && "Pedido Concluído"}
                            {orderInfo.status === 'cancelled' && "Pedido Cancelado"}
                            {loading && <Loader size={12} className="animate-spin text-gray-400" />}
                        </p>
                    </div>
                </div>
            </div>

            {/* The Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white w-full max-w-md rounded-[32px] p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors z-10"
                        >
                            &times;
                        </button>
                        
                        <div className="mt-4">
                            <OrderStatusView order={orderInfo} status={orderInfo.status} whatsappNumber={whatsappNumber} />
                        </div>

                        {isFinished && (
                            <button 
                                onClick={clearTracker}
                                className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                            >
                                Limpar Histórico do Pedido
                            </button>
                        )}
                        {!isFinished && (
                            <p className="text-center mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 p-3 rounded-xl">
                                Pode fechar o menu à vontade.<br/>O seu pedido está guardado e em andamento.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ActiveOrderTracker;

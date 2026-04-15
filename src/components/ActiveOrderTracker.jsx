import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, ChefHat, CheckCircle, Truck, X, Award, XCircle } from 'lucide-react';

const ActiveOrderTracker = ({ restaurantId, primaryColor = '#D4AF37' }) => {
    const [activeOrder, setActiveOrder] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    // Format the subtext to hide technical data
    let displaySubtext = activeOrder?.table_number || '';
    const isDelivery = displaySubtext.includes('Entrega:');
    if (isDelivery) {
        displaySubtext = "Ao domicílio";
    } else if (displaySubtext.includes('| Pgto')) {
        displaySubtext = displaySubtext.split('|')[0].trim();
    }

    // Live ETA Calculation
    const [etaText, setEtaText] = useState('');
    useEffect(() => {
        if (!activeOrder?.created_at) return;
        const updateEta = () => {
             const targetMins = isDelivery ? 45 : 20;
             const diffMs = Date.now() - new Date(activeOrder.created_at).getTime();
             const elapsedMins = Math.floor(diffMs / 60000);
             const remaining = targetMins - elapsedMins;
             
             if (activeOrder.status === 'out_for_delivery') {
                 // The manual ETA timestamp is passed via rejection_reason
                 const manualEpochMs = parseInt(activeOrder.rejection_reason);
                 if (manualEpochMs && manualEpochMs > 1000000000000) {
                     const remainManual = Math.floor((manualEpochMs - Date.now()) / 60000);
                     if (remainManual > 0) {
                         setEtaText(`Chega em ~${remainManual} min`);
                     } else {
                         setEtaText('A chegar agora!');
                     }
                 } else {
                     // Fallback
                     setEtaText(remaining > 5 ? `Chega em ~${remaining} min` : 'A chegar agora!');
                 }
             } else if (activeOrder.status === 'arrived') {
                 setEtaText('À SUA PORTA!');
             } else if (activeOrder.status === 'ready') {
                 setEtaText(isDelivery ? 'A aguardar Motoboy' : 'Pode levantar/Servindo');
             } else {
                 setEtaText(remaining > 0 ? `Previsão: ${remaining} min` : 'Quase pronto!');
             }
        };
        updateEta();
        const t = setInterval(updateEta, 30000);
        return () => clearInterval(t);
    }, [activeOrder?.created_at, activeOrder?.status, isDelivery]);

    const checkActiveOrder = async () => {
        if (!restaurantId) return;
        const saved = localStorage.getItem(`jindungo_active_order_${restaurantId}`);
        if (!saved) return;

        try {
            const { id, timestamp } = JSON.parse(saved);
            
            // If the order is very old (e.g., > 12 hours) just hide it automatically and clear
            const orderAgeHours = (Date.now() - (timestamp || Date.now())) / (1000 * 60 * 60);
            if (orderAgeHours > 12) {
                localStorage.removeItem(`jindungo_active_order_${restaurantId}`);
                setActiveOrder(null);
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select('id, status, table_number, total, rejection_reason, created_at')
                .eq('id', id)
                .single();

            if (data) {
                setActiveOrder(data);
                setIsVisible(true);
            }
        } catch (e) {
            console.error("Erro ao procurar pedido ativo", e);
        }
    };

    useEffect(() => {
        checkActiveOrder();
        
        window.addEventListener('jindungo_new_order', checkActiveOrder);
        
        const interval = setInterval(checkActiveOrder, 15000); // Check every 15s

        // Optional: Realtime subscription
        let channel;
        if (restaurantId) {
            channel = supabase.channel(`public:orders:rest_${restaurantId}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
                    const saved = localStorage.getItem(`jindungo_active_order_${restaurantId}`);
                    if (saved) {
                        const { id } = JSON.parse(saved);
                        if (payload.new.id === id) {
                            setActiveOrder(payload.new);
                        }
                    }
                })
                .subscribe();
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener('jindungo_new_order', checkActiveOrder);
            if (channel) supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    if (!activeOrder || !isVisible) return null;

    const handleDismiss = () => {
        setIsVisible(false);
        // Clear from local storage
        localStorage.removeItem(`jindungo_active_order_${restaurantId}`);
    };

    const statusConfig = {
        'waiting_payment': { label: 'A Aguardar Pgto MCX', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Clock, border: 'border-orange-500/20' },
        'pending': { label: 'Recebido / Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, border: 'border-yellow-500/20' },
        'preparing': { label: 'Na Cozinha', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: ChefHat, border: 'border-orange-500/20' },
        'ready': { label: 'Pronto a Servir', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, border: 'border-green-500/20' },
        'out_for_delivery': { label: 'A Caminho da sua Morada', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Truck, border: 'border-cyan-500/20' },
        'arrived': { label: 'O Motoboy Chegou! 🛵💨', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle, border: 'border-green-500/50' },
        'delivered': { label: 'Pedido Entregue / Pago', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Truck, border: 'border-blue-500/20' },
        'paid': { label: 'Conta Fechada (Pago)', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', icon: Award, border: 'border-[#D4AF37]/20' },
        'cancelled': { label: 'Pedido Rejeitado', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, border: 'border-red-500/20' }
    };

    const currentStatus = statusConfig[activeOrder.status] || statusConfig['pending'];
    const Icon = currentStatus.icon;

    return (
        <div className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[9999] opacity-0 animate-slide-up duration-500 ${activeOrder.status === 'arrived' ? 'animate-pulse' : ''}`} style={{ animationFillMode: 'forwards' }}>
            <div className={`p-4 rounded-2xl border backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative ${currentStatus.bg} ${currentStatus.border}`} style={{ backgroundColor: 'rgba(10,10,10,0.9)' }}>
                <button 
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full"
                    title="Fechar acompanhamento"
                >
                    <X size={14} />
                </button>
                
                <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-400 mb-2 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {['pending', 'preparing'].includes(activeOrder.status) && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${['pending', 'preparing'].includes(activeOrder.status) ? 'bg-[#D4AF37]' : 'bg-gray-500'}`}></span>
                    </span>
                    Acompanhar Pedido
                </p>
                
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${currentStatus.bg} border ${currentStatus.border}`}>
                        <Icon size={22} className={currentStatus.color} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start w-full">
                            <h4 className={`text-base font-bold ${currentStatus.color} drop-shadow-sm`}>
                                {currentStatus.label}
                            </h4>
                            {etaText && !['delivered', 'paid', 'cancelled'].includes(activeOrder.status) && (
                                <span className="bg-black/40 text-white/90 text-[9px] font-bold px-2 py-1 rounded-md border border-white/10 whitespace-nowrap ml-2">
                                    {etaText}
                                </span>
                            )}
                        </div>
                        {activeOrder.status === 'cancelled' && activeOrder.rejection_reason ? (
                            <p className="text-xs text-red-400 mt-0.5">{activeOrder.rejection_reason}</p>
                        ) : (
                            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">{isDelivery ? '🛵 ' : '#'}{displaySubtext}</p>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {['pending', 'preparing', 'ready', 'out_for_delivery'].includes(activeOrder.status) && (
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden shadow-inner">
                        <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ 
                                backgroundColor: primaryColor || '#D4AF37',
                                width: activeOrder.status === 'pending' ? '25%' : (activeOrder.status === 'preparing' ? '50%' : (activeOrder.status === 'ready' ? '75%' : '100%')),
                                filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.8))'
                            }}
                        />
                    </div>
                )}
            </div>
            
            <style jsx>{`
                @keyframes slideUpFade {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default ActiveOrderTracker;

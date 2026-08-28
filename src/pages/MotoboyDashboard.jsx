import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { supabase } from '../lib/supabaseClient';
import { Bike, Navigation, MapPin, PackageCheck, Phone, AlertTriangle, CheckCircle, Banknote, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MotoboyDashboard() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadOrder = React.useCallback(async () => {
        if (!orderId) return;
        const { data, error } = await orderService.getOrderById(orderId);
        if (data) setOrder(data);
        if (error) console.error(error);
        setLoading(false);
    }, [orderId]);

    useEffect(() => {
        setTimeout(loadOrder, 0);
        
        // Polling para caso a cozinha cancele
        const timer = setInterval(loadOrder, 30000);
        return () => clearInterval(timer);
    }, [loadOrder]);

    // References to keep watch position and prevent leaks
    const watchIdRef = useRef(null);

    // [REAL-TIME] GPS Courier Tracking background watch
    useEffect(() => {
        if (order && order.status === 'out_for_delivery') {
            if ("geolocation" in navigator) {
                console.log("Iniciando monitorização de geolocalização do Estafeta...");
                
                if (watchIdRef.current) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }

                watchIdRef.current = navigator.geolocation.watchPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log(`Nova localização do Estafeta: ${latitude}, ${longitude}`);
                        
                        try {
                            const { error } = await supabase
                                .from('orders')
                                .update({
                                    courier_latitude: latitude,
                                    courier_longitude: longitude
                                })
                                .eq('id', orderId);
                            
                            if (error) throw error;
                        } catch (err) {
                            console.error("Erro ao atualizar GPS do estafeta no banco:", err);
                        }
                    },
                    (err) => {
                        console.error("Erro ao obter geolocalização do estafeta:", err);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                toast.error("Geolocalização não suportada pelo navegador.");
            }
        } else {
            if (watchIdRef.current) {
                console.log("Parando monitorização de geolocalização...");
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [order?.status, orderId]);

    const updateStatus = async (status, msg) => {
        const loadingId = toast.loading('A atualizar...');
        try {
            await orderService.updateOrderStatus(orderId, status);
            toast.success(msg || 'Sucesso!', { id: loadingId });
            loadOrder();
        } catch {
            toast.error('Ocorreu um erro. Verifique a internet.', { id: loadingId });
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
    </div>;

    if (!order) return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 text-white flex-col gap-2">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold bg-red-500/20 px-6 py-2 border border-red-500/50 rounded-full text-red-500 uppercase tracking-widest text-center">Ligação Expirada</h2>
        <p className="text-gray-400 text-center opacity-80 max-w-sm mt-2">Esta entrega fechou fisicamente ou o link está incorreto. Confirme com o Gerente do Restaurante.</p>
    </div>;

    // Delivery fields logic
    const isDelivery = order.table_number?.includes('Entrega:') || order.order_type === 'delivery';
    let displayAddress = order.table_number;
    let mapsLink = null;
    let paymentMethod = null;
    let extractedGps = null;

    if (order.order_type === 'delivery' && order.delivery_address) {
        displayAddress = order.delivery_address;
        if (order.delivery_neighborhood) displayAddress += ` (${order.delivery_neighborhood})`;
        if (order.delivery_reference) {
            if (order.delivery_reference.includes('| GPS:')) {
                const parts = order.delivery_reference.split('| GPS:');
                extractedGps = parts[1]?.trim();
                displayAddress += `\nReferência: ${parts[0]?.trim()}`;
            } else if (order.delivery_reference.includes('GPS:')) {
                const parts = order.delivery_reference.split('GPS:');
                extractedGps = parts[1]?.trim();
            } else {
                displayAddress += `\nReferência: ${order.delivery_reference}`;
            }
        }
        if (order.table_number?.includes('| Pgto:')) {
            const parts = order.table_number.split('| Pgto:');
            paymentMethod = parts[1]?.trim();
        }
        if (order.table_number?.includes('Maps:')) {
            const mPart = order.table_number.split('|').find(p => p.trim().startsWith('Maps:'));
            if (mPart) mapsLink = mPart.replace('Maps:', '').trim();
        }
    } else if (isDelivery && order.table_number?.includes('Entrega:')) {
        const parts = order.table_number.split('|').map(p => p.trim());
        displayAddress = parts[0].replace('Entrega:', '').trim();
        parts.forEach(part => {
             if (part.startsWith('Maps:')) mapsLink = part.replace('Maps:', '').trim();
             if (part.startsWith('Pgto:')) paymentMethod = part.replace('Pgto:', '').trim();
             if (part.startsWith('Ref:')) {
                 const refStr = part.replace('Ref:', '').trim();
                 if (refStr.includes('| GPS:')) {
                     const rParts = refStr.split('| GPS:');
                     extractedGps = rParts[1]?.trim();
                     displayAddress += `\nReferência: ${rParts[0]?.trim()}`;
                 } else {
                     displayAddress += `\nReferência: ${refStr}`;
                 }
             }
        });
    } else {
         displayAddress = "Pedido #" + order.table_number;
    }

    const isGpsValid = (str) => {
        if (!str) return false;
        return /^-?[0-9.]+,\s*-?[0-9.]+$/.test(str.trim());
    };
    const hasValidGps = extractedGps && isGpsValid(extractedGps);

    if (!mapsLink) {
        if (hasValidGps) {
            mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(extractedGps)}`;
        } else if (order.delivery_address && order.delivery_address !== 'Partilhar no WhatsApp 📍') {
            mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address + ' ' + (order.delivery_neighborhood || ''))}`;
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] pb-8 pt-4 px-4 font-sans max-w-md mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 relative overflow-hidden backdrop-blur-xl animate-fade-in-down shadow-xl shadow-cyan-900/10">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Bike size={80} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tight leading-tight uppercase font-serif">
                        {order.courier_name ? (
                            <>Estafeta <span className="text-[#D4AF37]">{order.courier_name}</span></>
                        ) : (
                            <>Motorista <br/><span className="text-[#D4AF37]">Jindungo</span></>
                        )}
                    </h1>
                    <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold opacity-80 mt-1">HUB LOGÍSTICO</p>
                </div>
            </header>

            {/* Address */}
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-4 shadow-lg animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex gap-4">
                    <div className="mt-1">
                        <div className="bg-cyan-500/20 p-3 rounded-full border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            <Navigation size={24} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={10}/> Entrega na Morada</p>
                        <h2 className="text-white font-bold leading-snug whitespace-pre-line text-sm break-words">{displayAddress}</h2>
                        <div className="text-gray-400 text-sm mt-3 border-t border-white/10 pt-3 flex flex-col gap-2">
                            <span className="flex items-center gap-2 text-white font-semibold"><User size={14} className="text-[#D4AF37]"/> {order.customer_name}</span>
                            {order.customer_phone && (
                                <div className="flex gap-2.5 mt-1">
                                    <a href={`tel:${order.customer_phone}`} className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 border border-green-500/30 transition-all shadow-md">
                                        <Phone size={14} /> Ligar Direto
                                    </a>
                                    <a 
                                        href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 border border-[#25D366]/30 transition-all shadow-md"
                                    >
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                        WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {mapsLink && (
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="mt-6 w-full animate-pulse bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/30 transition-all border border-blue-400/30">
                        <MapPin size={18} /> {hasValidGps ? 'Navegar no Mapa (App Google Maps)' : 'Procurar no Google Maps'}
                    </a>
                )}
            </div>

            {/* Items Check */}
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-4 shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5"><PackageCheck size={14}/> Conferência de Mochila</p>
                <div className="space-y-3">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start pb-3 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="bg-white/10 text-[#D4AF37] px-2 py-1 rounded text-xs font-bold shrink-0">{item.quantity}x</div>
                            <div>
                                <p className="text-white font-medium text-sm">{item.name}</p>
                                {item.notes && <p className="text-gray-500 text-xs mt-0.5">{item.notes}</p>}
                            </div>
                        </div>
                    ))}
                </div>
                {paymentMethod && (
                    <div className="mt-5 pt-4 border-t border-dashed border-white/10 flex justify-between items-center text-sm">
                         <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-1"><Banknote size={12}/> Condição PGT:</span>
                         <span className="text-white font-bold max-w-[50%] text-right">{paymentMethod}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                {order.status === 'out_for_delivery' && (
                    <button 
                        onClick={() => updateStatus('arrived', 'Notificamos o Cliente!')}
                        className="w-full bg-[#1e293b] border-2 border-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-400 text-yellow-500 font-black uppercase tracking-widest text-[13px] py-6 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all"
                    >
                        <CheckCircle size={28} /> ESPEREI À PORTA (CHEGUEI)
                    </button>
                )}

                {order.status === 'arrived' && (
                    <button 
                        onClick={() => updateStatus('delivered', 'Entrega Finalizada!')}
                        className="w-full bg-gradient-to-r from-green-600 focus:ring-4 ring-green-900 to-emerald-600 hover:brightness-110 text-white font-black uppercase tracking-widest text-[13px] py-6 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(22,163,74,0.3)] border border-green-400/50 transition-all"
                    >
                        <Banknote size={28} /> Mão à Obra (Concluído)
                    </button>
                )}

                {(order.status === 'delivered' || order.status === 'paid' || order.status === 'cancelled') && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center shadow-lg shadow-green-900/10">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                        <h2 className="text-green-400 font-bold text-lg uppercase tracking-widest">Entrega Finalizada</h2>
                        <p className="text-green-600/70 text-xs font-medium uppercase tracking-widest mt-1">Pode regressar à base.</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in-down { animation: fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
}



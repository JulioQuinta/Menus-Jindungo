import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';
import { 
    Clock, ChefHat, CheckCircle2, Truck, XCircle, Award, 
    Phone, MessageSquare, ChevronLeft, MapPin, Share2, 
    FileText, HelpCircle, UtensilsCrossed, Star, Check,
    CreditCard, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Golden Metallic Palette
const PRIMARY_GOLD = '#D4AF37';

// Premium Golden Custom Icons for Leaflet
const restaurantIcon = L.isLeaflet ? null : L.divIcon({
    className: 'custom-restaurant-icon',
    html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(212, 175, 55, 0.25); border: 1px solid rgba(212, 175, 55, 0.5); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background-color: black; border: 2px solid #D4AF37; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.8);">
                <span style="font-size: 14px;">🍳</span>
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const customerIcon = L.isLeaflet ? null : L.divIcon({
    className: 'custom-customer-icon',
    html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: black; border: 2px solid #D4AF37; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.8);">
                <span style="font-size: 14px;">🏠</span>
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const courierIcon = L.isLeaflet ? null : L.divIcon({
    className: 'custom-courier-icon',
    html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="position: relative; width: 36px; height: 36px; border-radius: 50%; background-color: black; border: 2px solid #f59e0b; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 25px -5px rgba(245, 158, 11, 0.3);">
                <span style="font-size: 16px;">🛵</span>
            </div>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

// Sub-component for auto-bounds and zoom management
const MapController = ({ restaurantCoords, customerCoords, courierCoords }) => {
    const map = useMap();
    
    useEffect(() => {
        const points = [];
        if (restaurantCoords) points.push([restaurantCoords.lat, restaurantCoords.lng]);
        if (customerCoords) points.push([customerCoords.lat, customerCoords.lng]);
        if (courierCoords) points.push([courierCoords.lat, courierCoords.lng]);
        
        if (points.length > 0) {
            if (points.length === 1) {
                map.setView(points[0], 16);
            } else {
                map.fitBounds(points, { padding: [40, 40], maxZoom: 16 });
            }
        }
    }, [restaurantCoords, customerCoords, courierCoords, map]);
    
    return null;
};

const OrderTrackerPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [etaText, setEtaText] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const previousStatusRef = useRef(null);

    const handleBackToMenu = () => {
        if (order?.restaurant?.slug) {
            navigate(`/${order.restaurant.slug}`);
            return;
        }
        if (order?.restaurant_id) {
            const savedSlug = localStorage.getItem(`jindungo_slug_${order.restaurant_id}`);
            if (savedSlug) {
                navigate(`/${savedSlug}`);
                return;
            }
        }
        const lastSlug = localStorage.getItem('jindungo_last_slug');
        if (lastSlug) {
            navigate(`/${lastSlug}`);
            return;
        }
        navigate('/');
    };

    // Initial Fetch
    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);

            // Handle temporary local offline orders beautifully
            if (orderId && orderId.startsWith('offline-order-')) {
                const activeOffline = localStorage.getItem('jindungo_active_order_offline_pending');
                if (activeOffline) {
                    try {
                        const parsed = JSON.parse(activeOffline);
                        if (parsed.id === orderId) {
                            setOrder({
                                id: orderId,
                                status: 'pending',
                                customer_name: parsed.orderData.customer_name,
                                items: parsed.orderData.items,
                                total: parsed.orderData.total,
                                order_type: parsed.orderData.order_type,
                                delivery_address: parsed.orderData.delivery_address,
                                delivery_neighborhood: parsed.orderData.delivery_neighborhood,
                                delivery_reference: parsed.orderData.delivery_reference,
                                delivery_fee: parsed.orderData.delivery_fee,
                                created_at: new Date(parsed.timestamp).toISOString(),
                                isOfflinePlaceholder: true
                            });
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Error parsing offline order:", e);
                    }
                }
                toast.error("Pedido offline não localizado.");
                const lastSlug = localStorage.getItem('jindungo_last_slug');
                navigate(lastSlug ? `/${lastSlug}` : '/');
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await orderService.getOrderById(orderId);
                if (error || !data) {
                    toast.error("Pedido não encontrado ou ID inválido.");
                    const lastSlug = localStorage.getItem('jindungo_last_slug');
                    navigate(lastSlug ? `/${lastSlug}` : '/');
                } else {
                    setOrder(data);
                    previousStatusRef.current = data.status;
                }
            } catch (err) {
                console.error("Error fetching order:", err);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();
    }, [orderId, navigate]);

    // Supabase Realtime Subscription
    useEffect(() => {
        if (!order?.restaurant_id || !orderId) return;

        const channel = orderService.subscribeToOrders(order.restaurant_id, (payload) => {
            if (payload.new && payload.new.id === orderId) {
                setOrder(prev => ({
                    ...prev,
                    ...payload.new
                }));
            }
        });

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [order?.restaurant_id, orderId]);

    // Live Notification Trigger & Acoustic Bell Effect
    useEffect(() => {
        if (!order?.status) return;

        const currentStatus = order.status;
        const prevStatus = previousStatusRef.current;

        if (prevStatus && currentStatus !== prevStatus) {
            // Acoustic bell effect
            try {
                const audio = new Audio('/bell.mp3');
                audio.volume = 0.4;
                audio.play().catch(e => console.log('Autoplay audio blocked by browser settings', e));
            } catch (e) { /* silent catch */ }

            // Refined golden toasts
            const toastStyle = {
                background: '#121213',
                color: '#fff',
                borderRadius: '20px',
                border: `1px solid ${PRIMARY_GOLD}`,
                padding: '16px 20px',
                fontSize: '13px',
                fontWeight: '600',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                fontFamily: 'serif'
            };

            if (currentStatus === 'preparing') {
                toast("👨‍🍳 O Chef na cozinha já começou a preparar o seu pedido!", { icon: '🔥', style: toastStyle });
            } else if (currentStatus === 'ready') {
                toast("🛎️ O seu pedido está pronto! A sair quentinho da cozinha.", { icon: '🍽️', style: toastStyle });
            } else if (currentStatus === 'out_for_delivery') {
                toast("🛵 A sua encomenda acabou de sair para entrega ao domicílio!", { icon: '💨', style: toastStyle });
            } else if (currentStatus === 'arrived') {
                toast("📍 O estafeta chegou! Por favor, vá ao encontro dele.", { icon: '🛵', style: toastStyle });
            } else if (currentStatus === 'cancelled') {
                toast.error("O seu pedido foi cancelado ou rejeitado pelo restaurante.", { style: { ...toastStyle, border: '1px solid #EF4444' } });
            }
        }

        previousStatusRef.current = currentStatus;
    }, [order?.status]);

    // Live ETA Calculation
    useEffect(() => {
        if (!order?.created_at) return;

        const updateEta = () => {
            const isDelivery = order.order_type === 'delivery';
            const targetMins = isDelivery ? 45 : 20;
            const diffMs = Date.now() - new Date(order.created_at).getTime();
            const elapsedMins = Math.floor(diffMs / 60000);
            const remaining = targetMins - elapsedMins;

            if (order.status === 'out_for_delivery') {
                const manualEpochMs = parseInt(order.rejection_reason);
                if (manualEpochMs && manualEpochMs > 1000000000000) {
                    const remainManual = Math.floor((manualEpochMs - Date.now()) / 60000);
                    setEtaText(remainManual > 0 ? `Entrega em ~${remainManual} min` : 'A chegar agora!');
                } else {
                    setEtaText(remaining > 5 ? `Chega em ~${remaining} min` : 'A chegar agora!');
                }
            } else if (order.status === 'arrived') {
                setEtaText('À SUA PORTA!');
            } else if (order.status === 'ready') {
                setEtaText(isDelivery ? 'A aguardar Estafeta' : 'Pronto para servir/levantar!');
            } else if (order.status === 'cancelled') {
                setEtaText('Cancelado');
            } else {
                setEtaText(remaining > 0 ? `Entrega prevista em ${remaining} min` : 'Quase pronto!');
            }
        };

        updateEta();
        const interval = setInterval(updateEta, 15000);
        return () => clearInterval(interval);
    }, [order?.created_at, order?.status, order?.rejection_reason, order?.order_type]);

    // Share Tracking Link
    const handleShare = () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: `Acompanhar Pedido - Menús Jindungos`,
                text: `Acompanha o meu pedido real-time no restaurante!`,
                url: shareUrl
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success("Link de rastreamento copiado!");
        }
    };

    // Rating Submission
    const handleRating = (val) => {
        setRating(val);
    };

    const submitFeedback = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedbacks')
                .insert([{
                    order_id: order?.id,
                    restaurant_id: order?.restaurant_id,
                    rating,
                    comment,
                    customer_name: order?.customer_name || 'Cliente Anónimo'
                }]);

            if (error) throw error;
            setIsSubmitted(true);
            toast.success("Obrigado pela sua avaliação privada!");
        } catch (err) {
            console.error("Feedback error:", err);
            setIsSubmitted(true); // Graceful fallback
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-[#D4AF37]/10 rounded-full animate-ping"></div>
                    <div className="absolute inset-2 border-4 border-[#D4AF37]/30 rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                    <div className="absolute inset-4 bg-[#D4AF37] rounded-full flex items-center justify-center">
                        <span className="text-black font-serif font-black text-xl">J</span>
                    </div>
                </div>
                <p className="text-[#D4AF37] font-serif font-bold text-sm tracking-[0.2em] uppercase animate-pulse">
                    A sintonizar rastreador...
                </p>
            </div>
        );
    }

    const isDelivery = order?.order_type === 'delivery';

    // Status Timeline Mappings
    const stages = [
        { key: 'pending', label: 'Recebido', desc: 'A aguardar confirmação', icon: Clock },
        { key: 'preparing', label: 'Na Cozinha', desc: 'Em preparação pelo Chef', icon: ChefHat },
        { key: 'ready', label: 'Pronto', desc: isDelivery ? 'Encomenda embalada' : 'Pronto para servir', icon: CheckCircle2 },
        { key: 'out_for_delivery', label: 'A Caminho', desc: 'Estafeta saiu com o pedido', icon: Truck },
        { key: 'delivered', label: 'Entregue', desc: 'Refeição concluída', icon: Award }
    ];

    // Status progression helper
    const getStageIndex = (currentStatus) => {
        const normalized = String(currentStatus).toLowerCase().trim();
        if (normalized === 'waiting_payment') return 0;
        if (normalized === 'pending') return 0;
        if (normalized === 'preparing') return 1;
        if (normalized === 'ready') return 2;
        if (normalized === 'out_for_delivery') return 3;
        if (normalized === 'arrived') return 3;
        if (normalized === 'delivered' || normalized === 'paid' || normalized === 'pago') return 4;
        return 0;
    };

    const currentStageIndex = getStageIndex(order?.status);
    const isCancelled = order?.status === 'cancelled';

    // Helper to parse coordinate string like "-8.83833, 13.2344"
    const parseGpsString = (str) => {
        if (!str) return null;
        const match = str.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (match) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }
        return null;
    };

    // Extract customer coordinates
    let customerCoords = null;
    if (order?.delivery_reference) {
        let gpsStr = null;
        if (order.delivery_reference.includes('| GPS:')) {
            gpsStr = order.delivery_reference.split('| GPS:')[1]?.trim();
        } else if (order.delivery_reference.includes('GPS:')) {
            gpsStr = order.delivery_reference.split('GPS:')[1]?.trim();
        }
        if (gpsStr) {
            customerCoords = parseGpsString(gpsStr);
        }
    }

    // Extract restaurant coordinates (Default to Talatona if missing)
    let restaurantCoords = null;
    if (order?.restaurant?.business_info?.location?.maps_link) {
        restaurantCoords = parseGpsString(order.restaurant.business_info.location.maps_link);
    }
    if (!restaurantCoords) {
        // Fallback standard Talatona, Luanda coordinate
        restaurantCoords = { lat: -8.9224, lng: 13.1818 };
    }

    // Extract courier coordinates
    let courierCoords = null;
    if (order?.courier_latitude && order?.courier_longitude) {
        courierCoords = {
            lat: parseFloat(order.courier_latitude),
            lng: parseFloat(order.courier_longitude)
        };
    }

    return (
        <div className="min-h-screen bg-[#070707] text-white font-sans antialiased py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background metallic glow */}
            <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40" />
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-white/5 rounded-full blur-[100px] pointer-events-none -mb-40 -ml-40" />

            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={handleBackToMenu}
                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white"
                        title="Voltar ao cardápio"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="text-center">
                        <span className="text-[10px] font-black tracking-[0.25em] text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
                            Live Tracking 🌶️
                        </span>
                        <h1 className="text-xl font-serif font-black text-white mt-2">Acompanhe seu Pedido</h1>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-gray-400 hover:text-white"
                        title="Partilhar rastreamento"
                    >
                        <Share2 size={16} />
                    </button>
                </div>

                {/* Primary Status Card */}
                <div className="bg-[#0A0A0B]/95 border border-white/10 rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Código do Pedido</p>
                            <h2 className="text-lg font-mono font-black text-[#D4AF37] mt-0.5">
                                #{String(order?.id || '').slice(0, 8).toUpperCase()}
                            </h2>
                        </div>
                        {etaText && !isCancelled && !['delivered', 'paid', 'pago'].includes(order?.status) && (
                            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl px-4 py-2 text-right">
                                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider">Tempo Estimado</p>
                                <p className="text-sm font-black text-white leading-tight mt-0.5">{etaText}</p>
                            </div>
                        )}
                    </div>

                    {isCancelled ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
                            <XCircle className="text-red-500" size={44} />
                            <div>
                                <h3 className="font-bold text-red-400 text-base">Pedido Rejeitado ou Cancelado</h3>
                                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                                    {order?.rejection_reason || "Lamentamos, mas o restaurante precisou de cancelar o seu pedido. Por favor, entre em contacto via suporte."}
                                </p>
                            </div>
                        </div>
                    ) : order?.isOfflinePlaceholder ? (
                        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[2rem] p-6 text-center flex flex-col items-center gap-4 animate-pulse">
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                                <svg viewBox="0 0 24 24" width="32" height="32" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-[#D4AF37]">
                                    <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.5M5 12.5a10.94 10.94 0 0 1 5.83-2.84M8.5 16a5.5 5.5 0 0 1 7 0M10.88 10.88a1 1 0 0 1 2.24 2.24M12 20h.01"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-serif font-black text-white text-base">Aguardando Ligação de Rede</h3>
                                <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed font-light">
                                    O seu pedido foi registado offline com sucesso! Assim que o seu telemóvel recuperar a ligação à Internet, o pedido será enviado automaticamente para a cozinha do restaurante e a linha de acompanhamento ao vivo será ativada.
                                </p>
                                <span className="inline-block mt-4 text-[9px] font-black tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3.5 py-1 rounded-full border border-[#D4AF37]/20">
                                    Mantenha esta aba aberta 🔌
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* METALLIC TIMELINE */
                        <div className="relative py-4 pl-8 sm:pl-0 sm:flex sm:justify-between space-y-6 sm:space-y-0">
                            
                            {/* Horizontal Line (Desktop) / Vertical Line (Mobile) */}
                            <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-white/10 sm:hidden" />
                            <div className="hidden sm:block absolute left-8 right-8 top-8 h-1 bg-white/10 z-0">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500 transition-all duration-1000 ease-out shadow-[0_0_10px_#D4AF37]"
                                    style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                                />
                            </div>

                            {stages.map((stage, idx) => {
                                const StageIcon = stage.icon;
                                const isCompleted = idx < currentStageIndex;
                                const isActive = idx === currentStageIndex;
                                
                                return (
                                    <div 
                                        key={stage.key}
                                        className={`relative sm:flex sm:flex-col sm:items-center sm:text-center sm:flex-1 z-10 transition-all ${
                                            isActive ? 'scale-105' : 'opacity-60'
                                        }`}
                                    >
                                        {/* Stage Bubble */}
                                        <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
                                            <div 
                                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                                    isCompleted 
                                                        ? 'bg-gradient-to-br from-[#D4AF37] to-amber-500 border-amber-600 text-gray-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                                        : (isActive 
                                                            ? 'bg-[#0A0A0B] border-[#D4AF37] text-[#D4AF37] animate-pulse shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                                                            : 'bg-[#1A1A1C] border-white/10 text-gray-600')
                                                }`}
                                            >
                                                {isCompleted ? <Check size={16} strokeWidth={3.5} /> : <StageIcon size={18} />}
                                            </div>
                                            
                                            <div className="sm:mt-2">
                                                <h4 className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-[#D4AF37]' : 'text-white'}`}>
                                                    {stage.label}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5 sm:max-w-[110px] sm:mx-auto">
                                                    {isActive ? stage.desc : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* PAYMENT PENDING DETAILS (waiting_payment) */}
                {order?.status === 'waiting_payment' && (
                    <div className="bg-[#0A0A0B]/95 border border-[#D4AF37]/30 rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl border-t-2 border-t-[#D4AF37] space-y-6 animate-in slide-in-from-bottom-6 duration-500">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">Aguardando Pagamento Digital</h3>
                                <p className="text-[10px] text-gray-500 font-medium">Por favor, conclua a transação para enviar o pedido à cozinha</p>
                            </div>
                        </div>

                        {/* Determine if payment is express or reference */}
                        {order.table_number?.includes('Pgto: Express') ? (
                            <div className="space-y-4">
                                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl text-xs space-y-2 text-blue-400">
                                    <p className="font-bold flex items-center gap-1.5"><Smartphone size={14} /> Multicaixa Express Push:</p>
                                    <p>Enviámos uma solicitação de pagamento para o número associado <span className="font-mono font-bold text-white">{order.customer_phone || 'registado'}</span>.</p>
                                    <p className="text-gray-400">Abra a sua aplicação Multicaixa Express no telemóvel e autorize o débito nas próximas notificações de compras.</p>
                                </div>
                                <div className="flex items-center justify-center gap-3 py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D4AF37]"></div>
                                    <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">A aguardar autorização do telemóvel...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl text-xs space-y-1.5 text-purple-400">
                                    <p className="font-bold flex items-center gap-1.5"><CreditCard size={14} /> Pagamento de Serviços (Referência Multicaixa):</p>
                                    <p>Pode pagar num Caixa Automático (ATM) ou no seu Internet Banking usando a referência gerada.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-4 rounded-2xl text-xs">
                                    <div>
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Entidade</span>
                                        <strong className="text-base font-mono text-white block mt-0.5">20024</strong>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Referência</span>
                                        <strong className="text-base font-mono text-[#D4AF37] block mt-0.5">
                                            {(() => {
                                                let hash = 0;
                                                for (let i = 0; i < (order.id || '').length; i++) {
                                                    hash = (order.id || '').charCodeAt(i) + ((hash << 5) - hash);
                                                }
                                                const ref = Math.abs(hash).toString().substring(0, 9).padEnd(9, '7');
                                                return `${ref.substring(0, 3)} ${ref.substring(3, 6)} ${ref.substring(6, 9)}`;
                                            })()}
                                        </strong>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Valor a Pagar</span>
                                        <strong className="text-base font-mono text-white block mt-0.5">{new Intl.NumberFormat('pt-AO').format(order.total || 0)} Kz</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Sandbox/Simulate Button */}
                        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Modo de Teste / Sandbox:</span>
                            <button
                                onClick={async () => {
                                    try {
                                        const { error } = await supabase
                                            .from('orders')
                                            .update({ status: 'pending' })
                                            .eq('id', order.id);
                                        if (error) throw error;
                                        toast.success("Pagamento Simulado! O pedido foi enviado para a cozinha.");
                                        setOrder(prev => ({ ...prev, status: 'pending' }));
                                    } catch (err) {
                                        toast.error("Erro ao simular pagamento.");
                                    }
                                }}
                                className="bg-[#D4AF37] text-gray-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                                Simular Pagamento Concluído ✅
                            </button>
                        </div>
                    </div>
                )}

                {/* LIVE MAP CARD */}
                {isDelivery && ['out_for_delivery', 'arrived'].includes(order?.status) && (
                    <div className="bg-[#0A0A0B]/95 border border-white/10 rounded-[32px] p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
                        {/* Golden Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/20">
                                    MAPA GPS AO VIVO
                                </span>
                                <h3 className="text-base font-serif font-black text-white mt-1.5 flex items-center gap-2">
                                    <MapPin size={18} className="text-[#D4AF37] animate-pulse" />
                                    Acompanhe a Entrega
                                </h3>
                                <p className="text-[10px] text-gray-500 font-medium">Veja a rota e a aproximação do estafeta ao vivo</p>
                            </div>
                            {courierCoords ? (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                                    Sinal GPS Ativo
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                                    A aguardar sinal GPS
                                </span>
                            )}
                        </div>

                        {/* Interactive Leaflet Map Container */}
                        <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-white/10 shadow-inner relative z-0 premium-dark-map">
                            <MapContainer 
                                center={[restaurantCoords.lat, restaurantCoords.lng]} 
                                zoom={14} 
                                style={{ height: '100%', width: '100%', background: '#0F0F0F' }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                
                                {/* Auto zoom controller */}
                                <MapController 
                                    restaurantCoords={restaurantCoords} 
                                    customerCoords={customerCoords} 
                                    courierCoords={courierCoords} 
                                />

                                {/* Restaurant Marker */}
                                {restaurantCoords && (
                                    <Marker 
                                        position={[restaurantCoords.lat, restaurantCoords.lng]} 
                                        icon={restaurantIcon}
                                    />
                                )}

                                {/* Customer Marker */}
                                {customerCoords && (
                                    <Marker 
                                        position={[customerCoords.lat, customerCoords.lng]} 
                                        icon={customerIcon}
                                    />
                                )}

                                {/* Live Courier Marker */}
                                {courierCoords && (
                                    <Marker 
                                        position={[courierCoords.lat, courierCoords.lng]} 
                                        icon={courierIcon}
                                    />
                                )}
                            </MapContainer>
                        </div>
                        <style>{`
                            .premium-dark-map .leaflet-tile-container {
                                filter: invert(100%) hue-rotate(180deg) brightness(40%) contrast(150%) saturate(60%);
                            }
                            .premium-dark-map .leaflet-container {
                                background: #0d0d0d !important;
                            }
                            .premium-dark-map .leaflet-bar {
                                border: 1px solid rgba(255,255,255,0.1) !important;
                                background-color: #0A0A0B !important;
                                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5) !important;
                            }
                            .premium-dark-map .leaflet-bar a {
                                background-color: #0A0A0B !important;
                                color: #D4AF37 !important;
                                border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                            }
                            .premium-dark-map .leaflet-bar a:hover {
                                background-color: #1c1c1c !important;
                                color: #fff !important;
                            }
                            @keyframes ping {
                                75%, 100% {
                                    transform: scale(2);
                                    opacity: 0;
                                }
                            }
                        `}</style>
                    </div>
                )}

                {/* Courier Logistics Card */}
                {isDelivery && ['out_for_delivery', 'arrived'].includes(order?.status) && (
                    <div className="bg-[#0A0A0B]/95 border border-white/10 rounded-[28px] p-5 shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-6 duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center shadow-inner">
                                <Truck size={24} className="animate-bounce" />
                            </div>
                            <div className="text-center sm:text-left">
                                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider">Estafeta Alocado</span>
                                <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                                    {order?.courier_name || "Alocado à Encomenda"}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">A caminho da sua morada 🛵💨</p>
                            </div>
                        </div>

                        {order?.courier_phone && (
                            <div className="flex gap-2">
                                <a 
                                    href={`tel:${order.courier_phone}`}
                                    className="bg-green-500 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg"
                                >
                                    <Phone size={14} /> Ligar
                                </a>
                                <a 
                                    href={`https://wa.me/${String(order.courier_phone).replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-3 rounded-2xl flex items-center justify-center transition-all active:scale-95"
                                    title="Enviar WhatsApp"
                                >
                                    <MessageSquare size={16} />
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Receipt Details Card */}
                <div className="bg-[#0A0A0B]/95 border border-white/10 rounded-[32px] p-6 shadow-xl backdrop-blur-2xl">
                    <h3 className="font-serif font-bold text-white text-base mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                        <FileText size={18} className="text-[#D4AF37]" /> Talão de Consumo Digital
                    </h3>
                    
                    <div className="space-y-3">
                        {order?.items && order.items.map((item, idx) => {
                            const priceVal = item.price_value || parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0;
                            return (
                                <div key={idx} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                    <span className="text-gray-400 font-light">
                                        <strong className="text-white font-bold">{item.quantity}x</strong> {item.name}
                                    </span>
                                    <span className="font-semibold text-white">
                                        {new Intl.NumberFormat('pt-AO').format(priceVal * item.quantity)} Kz
                                    </span>
                                </div>
                            );
                        })}

                        {order?.coupon_code && (
                            <div className="pt-2 border-t border-dashed border-white/10 flex justify-between text-xs text-green-400 font-bold">
                                <span>Cupão Aplicado: {order.coupon_code}</span>
                                <span>-{new Intl.NumberFormat('pt-AO').format(order.coupon_discount)} Kz</span>
                            </div>
                        )}

                        {order?.is_loyalty_redemption && (
                            <div className="pt-2 border-t border-dashed border-white/10 flex items-center gap-1.5 text-xs text-[#D4AF37] font-bold">
                                <Award size={14} /> Recompensa de Fidelização: {order.loyalty_reward_text}
                            </div>
                        )}

                        {order?.delivery_fee > 0 && (
                            <div className="pt-2 border-t border-dashed border-white/10 flex justify-between text-xs text-blue-400 font-bold">
                                <span>Taxa de Entrega</span>
                                <span>+{new Intl.NumberFormat('pt-AO').format(order.delivery_fee)} Kz</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Total Pago</span>
                            <span className="text-2xl font-serif font-black text-[#D4AF37]">
                                {new Intl.NumberFormat('pt-AO').format(order?.total || 0)}
                                <span className="text-xs font-bold text-gray-400 ml-1">Kz</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rating & Feedback Section (Visible only when delivered/paid) */}
                {['delivered', 'paid', 'pago'].includes(String(order?.status).toLowerCase().trim()) && (
                    <div className="bg-[#0A0A0B]/95 border border-[#D4AF37]/30 rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden border-t-2 border-t-[#D4AF37]">
                        {!isSubmitted ? (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <h3 className="font-serif font-black text-white text-base">Como esteve a sua refeição? ⭐</h3>
                                    <p className="text-[10px] text-gray-500 font-light mt-0.5">Ajude o nosso restaurante a melhorar o serviço privado em Angola.</p>
                                </div>

                                <div className="flex justify-center gap-2 py-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRating(star)}
                                            className={`text-4xl transition-all transform active:scale-90 ${
                                                rating >= star ? 'text-[#D4AF37] scale-110 drop-shadow-[0_0_8px_#D4AF37]' : 'text-white/20 hover:text-white/40'
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                {rating > 0 && (
                                    <div className="space-y-3 animate-in fade-in duration-300">
                                        <textarea
                                            placeholder="Partilhe connosco o seu elogio ou sugestão privada de melhoria..."
                                            className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] text-white font-medium placeholder-gray-600 transition-all"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={3}
                                        />
                                        <button
                                            onClick={submitFeedback}
                                            disabled={isSubmitting}
                                            className="w-full py-3 bg-[#D4AF37] text-gray-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
                                        >
                                            {isSubmitting ? "A Enviar..." : "Enviar Avaliação de Alta Fidelidade"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4 space-y-2 animate-bounce-short">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center mx-auto">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <h3 className="font-bold text-green-400 text-sm">Feedback Enviado com Sucesso!</h3>
                                <p className="text-[10px] text-gray-400 leading-normal max-w-xs mx-auto">
                                    Obrigado. A sua avaliação privada foi entregue diretamente à direção do restaurante.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleBackToMenu}
                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <UtensilsCrossed size={14} /> Voltar ao Cardápio
                    </button>
                    <a 
                        href={`https://wa.me/${order?.restaurant?.whatsapp_number || '244923000000'}?text=Olá, preciso de suporte sobre o meu pedido #${String(order?.id || '').slice(0, 8).toUpperCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 text-green-400 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <HelpCircle size={14} /> Chamar Suporte WhatsApp
                    </a>
                </div>

                <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest pt-4">
                    Powered by Menús Jindungos 🌶️ • Angola 🇦🇴
                </p>
            </div>
        </div>
    );
};

export default OrderTrackerPage;

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { generateWhatsAppLink } from '../utils/whatsappGenerator';
// import { analyticsService } from '../services/analyticsService';
import { orderService } from '../services/orderService';
import { supabase } from '../lib/supabaseClient';
import OrderStatusView from './OrderStatusView';
import CheckoutUpsell from './CheckoutUpsell';
import { couponService } from '../services/couponService';
import { Ticket, X, CheckCircle2, Award, Star, UtensilsCrossed, Bike, User, Smartphone, MapPin, Banknote, CreditCard, ChevronRight } from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';

const CheckoutModal = ({ isOpen, onClose, restaurantId, whatsappNumber, features = {}, initialTable = '', deliveryConfig = {}, activeStaff = null }) => {
    const { cartItems, getCartTotal, clearCart } = useCart();

    // Form State
    const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'delivery'
    const [selectedZone, setSelectedZone] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showUpsell, setShowUpsell] = useState(true);

    // Initial load from localStorage
    useEffect(() => {
        const savedPhone = localStorage.getItem('customer_phone');
        if (savedPhone) setCustomerPhone(savedPhone);
        const savedName = localStorage.getItem('customer_name');
        if (savedName) setCustomerName(savedName);
    }, []);

    // Dine-in fields
    const [tableNumber, setTableNumber] = useState(initialTable);

    // Update table number if prop changes
    useEffect(() => {
        if (initialTable) setTableNumber(initialTable);
    }, [initialTable]);

    // Delivery fields
    const [address, setAddress] = useState('');
    const [addressReference, setAddressReference] = useState('');
    const [gpsCoords, setGpsCoords] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('O seu dispositivo não suporta geolocalização.');
            return;
        }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setGpsCoords(coords);
                setAddress(`GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
                setIsGettingLocation(false);
                toast.success('Localização obtida com sucesso!');
            },
            (err) => {
                console.error(err);
                setIsGettingLocation(false);
                toast.error('Não foi possível obter a localização. Escreva o endereço manualmente.');
            },
            { timeout: 10000 }
        );
    };

    // Payment fields
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'multicaixa'
    const [changeFor, setChangeFor] = useState('');

    // System Order State
    const [createdOrder, setCreatedOrder] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // Loyalty State
    const [loyaltyConfig, setLoyaltyConfig] = useState(null);
    const [loyaltyPoints, setLoyaltyPoints] = useState(null);
    const [isRedeemingLoyalty, setIsRedeemingLoyalty] = useState(false);

    useEffect(() => {
        if (isOpen && createdOrder && restaurantId) {
            const sub = orderService.subscribeToOrders(restaurantId, (payload) => {
                if (payload.new && payload.new.id === createdOrder.id) {
                    setCreatedOrder(payload.new);
                }
            });
            return () => {
                supabase.removeChannel(sub); // Logic might differ based on library version, reusing simplified close
            };
        }
    }, [isOpen, createdOrder, restaurantId]);

    // Fetch Loyalty Config
    useEffect(() => {
        if (isOpen && restaurantId && features.canCollectClientData) {
            loyaltyService.getConfig(restaurantId).then(({ data }) => {
                if (data && data.is_active) setLoyaltyConfig(data);
            });
        }
    }, [isOpen, restaurantId, features.canCollectClientData]);

    // Check Loyalty Points when phone changes
    useEffect(() => {
        if (customerPhone.length >= 7 && loyaltyConfig) {
            const timer = setTimeout(() => {
                loyaltyService.getCustomerPoints(restaurantId, customerPhone).then(({ count }) => {
                    setLoyaltyPoints(count);
                });
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setLoyaltyPoints(null);
            setIsRedeemingLoyalty(false);
        }
    }, [customerPhone, loyaltyConfig, restaurantId]);

    if (!isOpen) return null;

    const subtotal = getCartTotal();
    const deliveryFee = (orderType === 'delivery' && selectedZone) ? selectedZone.fee : 0;

    // Calculate Discount
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
            discount = (subtotal * appliedCoupon.discount_value) / 100;
        } else {
            discount = appliedCoupon.discount_value;
        }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        setCouponError('');

        const result = await couponService.validateCoupon(restaurantId, couponCode);

        if (result.valid) {
            // Check min purchase
            if (result.coupon.min_purchase > 0 && subtotal < result.coupon.min_purchase) {
                setCouponError(`Compra mínima para este cupão: ${result.coupon.min_purchase} Kz`);
                setAppliedCoupon(null);
            } else {
                setAppliedCoupon(result.coupon);
                setCouponError('');
            }
        } else {
            setCouponError(result.message);
            setAppliedCoupon(null);
        }
        setIsValidating(false);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const isSystemOrder = !!restaurantId; // If we have an ID, we use the system. If not (preview), we default to WhatsApp?

    const handleSendOrder = async () => {
        if (orderType === 'dine-in' && !tableNumber) return toast.error("Informe o número da mesa.");
        if (orderType === 'delivery' && !address) return toast.error("Informe o endereço.");

        setIsSending(true);

        const zoneInfo = (orderType === 'delivery' && selectedZone) ? `(${selectedZone.name} +${selectedZone.fee}Kz)` : '';
        const mapsLink = gpsCoords ? ` | Maps: https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : '';
        const refNote = addressReference ? ` | Ref: ${addressReference}` : '';
        const baseTableOrAddress = orderType === 'dine-in' ? tableNumber : `Entrega: ${address}${refNote}${mapsLink} ${zoneInfo}`;
        const paymentInfo = paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa Express';

        const orderData = {
            restaurant_id: restaurantId,
            items: cartItems,
            total: total,
            status: 'pending',
            customer_name: customerName || 'Cliente',
            customer_phone: customerPhone,
            table_number: `${baseTableOrAddress} | Pgto: ${paymentInfo}`,
            coupon_id: appliedCoupon?.id || null,
            coupon_code: appliedCoupon?.code || null,
            coupon_discount: discount,
            is_loyalty_redemption: isRedeemingLoyalty,
            loyalty_reward_text: isRedeemingLoyalty ? loyaltyConfig?.reward_text : null,
            staff_member_id: activeStaff ? activeStaff.id : null,
            staff_member_name: activeStaff ? activeStaff.name : null
        };

        try {
            // 1. Create System Order (if restaurantId exists)
            let newOrder = null;
            if (restaurantId) {
                const { data, error } = await orderService.createOrder(orderData);
                if (error) throw error;
                newOrder = data;
                setCreatedOrder(newOrder);
                clearCart();
                
                // Save customer info for future visits
                localStorage.setItem('customer_phone', customerPhone);
                localStorage.setItem('customer_name', customerName);
                
                if (features?.canUseKDS) {
                    // Save active order for the sophisticated tracking flow
                    localStorage.setItem(`jindungo_active_order_${restaurantId}`, JSON.stringify({
                        id: newOrder.id,
                        timestamp: Date.now()
                    }));
                    // Dispatch event so ActiveOrderTracker catches it immediately
                    window.dispatchEvent(new Event('jindungo_new_order'));
                }
            }

            // 2. Track Analytics
            // analyticsService.incrementOrders(restaurantId, cartItems);

            // 3. Fallback/Notification via WhatsApp
            // For Start plan (no KDS feature), we MUST auto-redirect to WhatsApp so the owner gets the order.
            if (!features?.canUseKDS || !restaurantId) {
                if (!restaurantId) {
                    toast.success("Modo Preview: Pedido simulado via WhatsApp.");
                }
                const link = generateWhatsAppLink(cartItems, total, orderType, { ...orderData, paymentMethod, changeFor }, whatsappNumber);
                const cacheBusterLink = link + (link.includes('?') ? '&' : '?') + 't=' + Date.now();
                window.location.href = cacheBusterLink;

                // If it's a real restaurant but no KDS, we can still close since WhatsApp is the main channel
                if (!features?.canUseKDS && restaurantId) {
                    onClose(); // Just close cart, they are on WhatsApp now
                    return; // Stop here so it doesn't show the OrderStatusView which implies an internal tracking
                }
            } else {
                // Since we use the sophisticated tracker now, just close the modal
                toast.success("Pedido Enviado com Sucesso! Acompanhe o status no ecrã principal.", {
                    icon: '🚀',
                    duration: 5000
                });
                closeAndReset();
            }

        } catch (err) {
            toast.error("Erro ao enviar pedido: " + err.message);
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const closeAndReset = () => {
        setCreatedOrder(null);
        setIsRedeemingLoyalty(false);
        onClose();
        // Cart is cleared on success, so user starts fresh
    };

    // If order created, we DO NOT show the modal here anymore, the Tracker takes over.
    // We just return null if success (though closeAndReset handles it, we keep this as safeguard)
    if (createdOrder) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', backdropFilter: 'blur(8px)' // More blur for premium feel
        }} onClick={onClose}>
            <div className="w-full max-w-md rounded-[32px] p-6 sm:p-8 shadow-2xl relative text-gray-900 border border-white/20 animate-in slide-in-from-bottom-10 duration-500" style={{
                background: 'rgba(255, 255, 255, 0.95)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>

                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-serif font-black text-gray-900 leading-tight">
                            {features?.hasUpsell && showUpsell ? 'Sugestões para Si' : 'Finalizar Pedido'}
                        </h2>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mt-1">
                            {cartItems.length} {cartItems.length === 1 ? 'Artigo Selecionado' : 'Artigos Selecionados'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {features?.hasUpsell && showUpsell ? (
                    <CheckoutUpsell
                        restaurantId={restaurantId}
                        cartItems={cartItems}
                        onContinue={() => setShowUpsell(false)}
                        onCancel={onClose}
                    />
                ) : (
                    <>
                        {/* Premium Tabs Order Type */}
                        <div className="flex bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-[20px] mb-8 border border-gray-200/50 shadow-inner group">
                            <button
                                onClick={() => setOrderType('dine-in')}
                                className={`flex-1 py-3 px-4 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-500 font-bold text-sm ${orderType === 'dine-in' ? 'bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                            >
                                <UtensilsCrossed size={16} className={orderType === 'dine-in' ? 'animate-bounce-short' : ''} />
                                <span>No Local</span>
                            </button>
                            <button
                                onClick={() => setOrderType('delivery')}
                                className={`flex-1 py-3 px-4 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-500 font-bold text-sm ${orderType === 'delivery' ? 'bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                            >
                                <Bike size={16} className={orderType === 'delivery' ? 'animate-bounce-short' : ''} />
                                <span>Entrega</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            {cartItems.map(item => (
                                <div key={item.cartItemId || item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4a5568' }}>
                                    <span>{item.quantity}x {item.name} {item.selectedVariant ? `(${item.selectedVariant})` : ''}</span>
                                    <span style={{ fontWeight: 'bold', color: '#1a202c' }}>{item.price}</span>
                                </div>
                            ))}
                            {(cartItems.length === 0) && <p className="text-gray-500"> Carrinho vazio.</p>}
                        </div>

                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '1rem 0' }} />

                        <div className="bg-gray-50/50 rounded-3xl p-5 mb-8 border border-gray-100 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(subtotal).replace('AOA', 'Kz')}</span>
                                </div>
                                {deliveryFee > 0 && (
                                    <div className="flex justify-between items-center text-sm font-bold text-blue-600">
                                        <div className="flex items-center gap-1.5">
                                            <Bike size={14} />
                                            <span>Taxa de Entrega</span>
                                        </div>
                                        <span>+{new Intl.NumberFormat('pt-AO').format(deliveryFee)} Kz</span>
                                    </div>
                                )}
                                {discount > 0 && (
                                    <div className="flex justify-between items-center text-sm font-bold text-green-600">
                                        <div className="flex items-center gap-1.5">
                                            <Ticket size={14} />
                                            <span>Desconto ({appliedCoupon?.code})</span>
                                        </div>
                                        <span>-{new Intl.NumberFormat('pt-AO').format(discount)} Kz</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-gray-200/50 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total a Pagar</span>
                                        <span className="text-3xl font-serif font-black text-gray-900 leading-none mt-1">
                                            {new Intl.NumberFormat('pt-AO').format(total)}
                                            <span className="text-xs ml-1 text-gray-400">Kz</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100/50 rounded-full text-green-700 text-[10px] font-black uppercase tracking-wider h-fit mb-1 border border-green-200/50">
                                        <CheckCircle2 size={10} />
                                        Seguro
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coupon Section */}
                        <div style={{ marginBottom: '1.5rem', background: 'rgba(212,175,55,0.05)', padding: '1rem', borderRadius: '16px', border: '1px dashed rgba(212,175,55,0.2)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Cupão de Desconto
                            </label>

                            {!appliedCoupon ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Tens um código?"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 bg-white"
                                        style={{ margin: 0, textTransform: 'uppercase' }}
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleApplyCoupon()}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCode || isValidating}
                                        style={{ background: '#D4AF37', color: 'black', border: 'none', padding: '0 1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                                    >
                                        {isValidating ? '...' : 'OK'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #c6f6d5' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2f855a', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        <CheckCircle2 size={16} /> {appliedCoupon.code}
                                    </div>
                                    <button onClick={removeCoupon} style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {couponError && (
                                <p style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold' }}>{couponError}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <User size={12} className="text-gray-400" />
                                    Seu Nome
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Ex: Ana Silva"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <Smartphone size={12} className="text-gray-400" />
                                    Telemóvel
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    placeholder="9xx xxx xxx"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Loyalty Card in Checkout */}
                        {loyaltyConfig && loyaltyPoints !== null && (
                            <div style={{
                                marginBottom: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
                                padding: '1.2rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(212,175,55,0.2)',
                                animation: 'fadeIn 0.4s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Award size={18} style={{ color: '#D4AF37' }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Cartão VIP {loyaltyPoints}/{loyaltyConfig.goal}
                                        </span>
                                    </div>
                                    {loyaltyPoints >= loyaltyConfig.goal && (
                                        <span style={{ fontSize: '0.7rem', background: '#38a169', color: 'white', padding: '2px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                                            RECOMPENSA!
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {[...Array(loyaltyConfig.goal)].map((_, i) => (
                                        <div key={i} style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: i < loyaltyPoints ? 'none' : '2px dashed rgba(0,0,0,0.1)',
                                            background: i < loyaltyPoints ? '#D4AF37' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: i < loyaltyPoints ? 'black' : 'rgba(0,0,0,0.1)'
                                        }}>
                                            <Star size={10} fill={i < loyaltyPoints ? "currentColor" : "none"} />
                                        </div>
                                    ))}
                                </div>

                                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
                                    {loyaltyPoints >= loyaltyConfig.goal
                                        ? `Parabéns! Recompensa: ${loyaltyConfig.reward_text}`
                                        : `Faltam ${loyaltyConfig.goal - loyaltyPoints} pedidos para o seu prémio!`
                                    }
                                </p>

                                {loyaltyPoints >= loyaltyConfig.goal && (
                                    <div className="mt-4 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between shadow-sm animate-bounce-short">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#D4AF37] p-2 rounded-full text-black">
                                                <Award size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">Usar Recompensa agora?</p>
                                                <p className="text-[10px] text-gray-500">{loyaltyConfig.reward_text}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsRedeemingLoyalty(!isRedeemingLoyalty)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${isRedeemingLoyalty ? 'bg-[#38a169]' : 'bg-gray-300'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRedeemingLoyalty ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {orderType === 'dine-in' ? (
                            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#4a5568', fontWeight: 'bold' }}>Mesa (Número, Nome ou Letra)</label>
                                    {initialTable && tableNumber === initialTable && (
                                        <span style={{ fontSize: '0.7rem', background: '#e6fffa', color: '#2c7a7b', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', border: '1px solid #b2f5ea' }}>
                                            ✓ Detectada via QR Code
                                        </span>
                                    )}
                                </div>
                                <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Ex: Mesa 4, Esplanada A..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400" />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                                {deliveryConfig?.enabled && deliveryConfig?.zones?.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4a5568', fontWeight: 'bold' }}>Bairro / Zona de Entrega</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900"
                                            value={selectedZone ? JSON.stringify(selectedZone) : ''}
                                            onChange={(e) => setSelectedZone(e.target.value ? JSON.parse(e.target.value) : null)}
                                            style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
                                        >
                                            <option value="" className="text-gray-500">Selecione o seu bairro...</option>
                                            {deliveryConfig.zones.map((zone, idx) => (
                                                <option key={idx} value={JSON.stringify(zone)} className="text-gray-900">
                                                    {zone.name} (+{zone.fee} Kz)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {/* GPS Location Button */}
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={isGettingLocation}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 mb-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                        gpsCoords 
                                            ? 'bg-green-50 border-green-400 text-green-700' 
                                            : 'bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400'
                                    } disabled:opacity-60`}
                                >
                                    <MapPin size={16} />
                                    {isGettingLocation ? 'A obter localização...' : gpsCoords ? '✓ Localização Obtida (GPS)' : 'Usar a Minha Localização (GPS)'}
                                </button>

                                {gpsCoords && (
                                    <a
                                        href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-700 mb-3 font-medium"
                                    >
                                        <MapPin size={12} /> Ver no Google Maps
                                    </a>
                                )}

                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4a5568', fontWeight: 'bold' }}>
                                    Endereço / Bairro
                                </label>
                                <textarea
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Ex: Talatona, Bloco C, Rua 28..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400"
                                    rows={2}
                                    style={{ resize: 'none' }}
                                />

                                <label style={{ display: 'block', margin: '0.75rem 0 0.5rem', fontSize: '0.9rem', color: '#4a5568', fontWeight: 'bold' }}>
                                    Ponto de Referência
                                </label>
                                <input
                                    type="text"
                                    value={addressReference}
                                    onChange={e => setAddressReference(e.target.value)}
                                    placeholder="Ex: Perto do Shoprite, Em frente ao Banco BFA…"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        )}

                        <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Forma de Pagamento</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'cash' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                >
                                    <Banknote size={18} />
                                    <span>Dinheiro</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('multicaixa')}
                                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'multicaixa' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                >
                                    <CreditCard size={18} />
                                    <span>Multicaixa Express</span>
                                </button>
                            </div>
                            {paymentMethod === 'cash' && (
                                <div className="mt-2 animate-in slide-in-from-right duration-300">
                                    <input
                                        type="number"
                                        placeholder="Troco para que valor?"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                                        value={changeFor}
                                        onChange={e => setChangeFor(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSendOrder}
                            disabled={cartItems.length === 0 || isSending}
                            className={`w-full group relative overflow-hidden p-5 rounded-[24px] font-black text-lg transition-all ${cartItems.length === 0 || isSending ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                            style={{
                                background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)',
                                color: '#D4AF37',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            
                            <div className="flex items-center justify-center gap-3 relative z-10">
                                {isSending ? (
                                    <div className="w-6 h-6 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{(features?.canUseKDS && restaurantId) ? 'Enviar Pedido à Cozinha' : 'Pedir via WhatsApp'}</span>
                                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>
                        </button>
                    </>
                )}
            </div>
            <style>{`
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CheckoutModal;

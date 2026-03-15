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

const CheckoutModal = ({ isOpen, onClose, restaurantId, whatsappNumber, features = {}, initialTable = '', deliveryConfig = {} }) => {
    const { cartItems, getCartTotal, clearCart } = useCart();

    // Form State
    const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'delivery'
    const [selectedZone, setSelectedZone] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showUpsell, setShowUpsell] = useState(true);

    // Dine-in fields
    const [tableNumber, setTableNumber] = useState(initialTable);

    // Update table number if prop changes
    useEffect(() => {
        if (initialTable) setTableNumber(initialTable);
    }, [initialTable]);

    // Delivery fields
    const [address, setAddress] = useState('');

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
        const baseTableOrAddress = orderType === 'dine-in' ? tableNumber : `Entrega: ${address} ${zoneInfo}`;
        const paymentInfo = paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa';

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
            coupon_discount: discount
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
                window.open(cacheBusterLink, '_blank');

                // If it's a real restaurant but no KDS, we can still close since WhatsApp is the main channel
                if (!features?.canUseKDS && restaurantId) {
                    onClose(); // Just close cart, they are on WhatsApp now
                    return; // Stop here so it doesn't show the OrderStatusView which implies an internal tracking
                }
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
        onClose();
        // Cart is cleared on success, so user starts fresh
    };

    // If order created, show Status View
    if (createdOrder) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeAndReset}>
                <div className="bg-white w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={closeAndReset}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors z-10"
                        aria-label="Fechar"
                    >
                        &times;
                    </button>
                    <div className="mt-2">
                        <OrderStatusView order={createdOrder} whatsappNumber={whatsappNumber} />
                        <button onClick={closeAndReset} className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">
                            Fechar / Novo Pedido
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', // Centered
            padding: '20px', backdropFilter: 'blur(2px)' // Add padding to avoid touching edges
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card, white)',
                width: '100%',
                maxWidth: '400px', // Constrain width
                borderRadius: '24px', // Rounded all around
                padding: '1.5rem',
                animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', // Much faster, snappy slide
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ height: '4px', width: '40px', background: '#cbd5e0', borderRadius: '2px', margin: '0 auto 1.5rem' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>
                        {features?.hasUpsell && showUpsell ? 'Quase lá...' : 'Finalizar Pedido'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}>&times;</button>
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
                        {/* Tabs Order Type */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8 border border-gray-200/50 shadow-inner">
                            <button
                                onClick={() => setOrderType('dine-in')}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-bold ${orderType === 'dine-in' ? 'bg-white text-primary shadow-md transform scale-[1.02]' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <UtensilsCrossed size={18} />
                                <span>No Local</span>
                            </button>
                            <button
                                onClick={() => setOrderType('delivery')}
                                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-bold ${orderType === 'delivery' ? 'bg-white text-primary shadow-md transform scale-[1.02]' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Bike size={18} />
                                <span>Entrega</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            {cartItems.map(item => (
                                <div key={item.cartItemId || item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <span>{item.quantity}x {item.name} {item.selectedVariant ? `(${item.selectedVariant})` : ''}</span>
                                    <span style={{ fontWeight: 'bold' }}>{item.price}</span>
                                </div>
                            ))}
                            {(cartItems.length === 0) && <p> Carrinho vazio.</p>}
                        </div>

                        <div style={{ borderTop: '1px dashed var(--border-color)', margin: '1rem 0' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(subtotal).replace('AOA', 'Kz')}</span>
                            </div>
                            {deliveryFee > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#3182ce', fontWeight: 'bold' }}>
                                    <span>Taxa de Entrega ({selectedZone?.name})</span>
                                    <span>+{deliveryFee} Kz</span>
                                </div>
                            )}
                            {discount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#38a169', fontWeight: 'bold' }}>
                                    <span>Desconto ({appliedCoupon?.code})</span>
                                    <span>-{discount} Kz</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                                <span>Total Final</span>
                                <span style={{ color: 'var(--color-primary)' }}>
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total).replace('AOA', 'Kz')}
                                </span>
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
                                        className="input-text"
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

                        <div className="grid grid-cols-2 gap-4 mb-6">
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
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
                            </div>
                        )}

                        {orderType === 'dine-in' ? (
                            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mesa (Número, Nome ou Letra)</label>
                                    {initialTable && tableNumber === initialTable && (
                                        <span style={{ fontSize: '0.7rem', background: '#e6fffa', color: '#2c7a7b', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', border: '1px solid #b2f5ea' }}>
                                            ✓ Detectada via QR Code
                                        </span>
                                    )}
                                </div>
                                <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Ex: Mesa 4, Esplanada A..." className="input-text" />
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
                                {deliveryConfig?.enabled && deliveryConfig?.zones?.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bairro / Zona de Entrega</label>
                                        <select
                                            className="input-text"
                                            value={selectedZone ? JSON.stringify(selectedZone) : ''}
                                            onChange={(e) => setSelectedZone(e.target.value ? JSON.parse(e.target.value) : null)}
                                            style={{ appearance: 'none', background: 'white url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right .7em top 50% / .65em auto' }}
                                        >
                                            <option value="">Selecione o seu bairro...</option>
                                            {deliveryConfig.zones.map((zone, idx) => (
                                                <option key={idx} value={JSON.stringify(zone)}>
                                                    {zone.name} (+{zone.fee} Kz)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Endereço Detalhado</label>
                                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Prédio, Apartamento..." className="input-text" rows={2} style={{ resize: 'none' }} />
                            </div>
                        )}

                        <div className="mb-8 p-5 bg-gray-50 rounded-[24px] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Forma de Pagamento</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
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
                                    <span>Multicaixa</span>
                                </button>
                            </div>
                            {paymentMethod === 'cash' && (
                                <div className="mt-2 animate-in slide-in-from-right duration-300">
                                    <input
                                        type="number"
                                        placeholder="Troco para que valor?"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all text-sm font-medium"
                                        value={changeFor}
                                        onChange={e => setChangeFor(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSendOrder}
                            disabled={cartItems.length === 0 || isSending}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '16px',
                                background: 'var(--color-primary)', color: 'white',
                                border: 'none', fontWeight: 'bold', fontSize: '1rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                cursor: 'pointer', opacity: (cartItems.length === 0 || isSending) ? 0.5 : 1
                            }}
                        >
                            {isSending ? 'Enviando...' : ((features?.canUseKDS && restaurantId) ? 'Enviar para Cozinha 👨‍🍳' : 'Enviar Pedido Via WhatsApp 🟢')}
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

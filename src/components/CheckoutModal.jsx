import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { generateWhatsAppLink } from '../utils/whatsappGenerator';
// import { analyticsService } from '../services/analyticsService';
import { orderService } from '../services/orderService';
import { supabase } from '../lib/supabaseClient';
import OrderStatusView from './OrderStatusView';
import CheckoutUpsell from './CheckoutUpsell';

const CheckoutModal = ({ isOpen, onClose, restaurantId, whatsappNumber, features = {}, initialTable = '', deliveryConfig = {} }) => {
    const { cartItems, getCartTotal, clearCart } = useCart();

    // Form State
    const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'delivery'
    const [selectedZone, setSelectedZone] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showUpsell, setShowUpsell] = useState(true); // Default to true, logic inside will instantly skip if no items

    // Dine-in fields
    const [tableNumber, setTableNumber] = useState(initialTable);

    // Update table number if prop changes
    useEffect(() => {
        if (initialTable) setTableNumber(initialTable);
    }, [initialTable]);

    // Delivery fields
    const [address, setAddress] = useState('');
    const [locationLink, setLocationLink] = useState('');

    // Payment fields
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'multicaixa'
    const [changeFor, setChangeFor] = useState('');

    // System Order State
    const [createdOrder, setCreatedOrder] = useState(null);
    const [isSending, setIsSending] = useState(false);

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

    if (!isOpen) return null;

    const subtotal = getCartTotal();
    const deliveryFee = (orderType === 'delivery' && selectedZone) ? selectedZone.fee : 0;
    const total = subtotal + deliveryFee;

    const isSystemOrder = !!restaurantId; // If we have an ID, we use the system. If not (preview), we default to WhatsApp?

    const handleSendOrder = async () => {
        if (orderType === 'dine-in' && !tableNumber) return alert("Informe o número da mesa.");
        if (orderType === 'delivery' && !address) return alert("Informe o endereço.");

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

            // 3. Fallback/Notification via WhatsApp (User choice or auto?)
            // For KDS, we emphasize the system, but WhatsApp is a good backup.
            // Let's just create the system order and show status.

            // If NO restaurantId (Preview Mode), we simulate or open WhatsApp
            if (!restaurantId) {
                alert("Modo Preview: Pedido simulado via WhatsApp.");
                window.open(generateWhatsAppLink(cartItems, total, orderType, { ...orderData, paymentMethod, changeFor }, whatsappNumber), '_blank');
                onClose();
            }

        } catch (err) {
            alert("Erro ao enviar pedido: " + err.message);
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
                        <div style={{ display: 'flex', background: '#edf2f7', padding: '4px', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <button onClick={() => setOrderType('dine-in')} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '10px', background: orderType === 'dine-in' ? 'white' : 'transparent', boxShadow: orderType === 'dine-in' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: '600', color: orderType === 'dine-in' ? 'var(--color-primary)' : '#718096', transition: 'all 0.2s', cursor: 'pointer' }}>
                                🍽️ Mesa
                            </button>
                            <button onClick={() => setOrderType('delivery')} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '10px', background: orderType === 'delivery' ? 'white' : 'transparent', boxShadow: orderType === 'delivery' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: '600', color: orderType === 'delivery' ? 'var(--color-primary)' : '#718096', transition: 'all 0.2s', cursor: 'pointer' }}>
                                🛵 Entrega
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                                <span>Total Final</span>
                                <span style={{ color: 'var(--color-primary)' }}>
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total).replace('AOA', 'Kz')}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Seu Nome</label>
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Ana Silva" className="input-text" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Telemóvel (WhatsApp)</label>
                                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="9xx xxx xxx" className="input-text" />
                            </div>
                        </div>

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

                        {/* Payment Methods */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Método de Pagamento</label>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                                    💵 Dinheiro
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="radio" name="payment" value="multicaixa" checked={paymentMethod === 'multicaixa'} onChange={() => setPaymentMethod('multicaixa')} />
                                    💳 Multicaixa
                                </label>
                            </div>
                            {paymentMethod === 'cash' && (
                                <div>
                                    <input type="number" placeholder="Troco para..." className="input-text" value={changeFor} onChange={e => setChangeFor(e.target.value)} />
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
                            {isSending ? 'Enviando...' : (restaurantId ? 'Enviar para Cozinha 👨‍🍳' : 'Enviar via WhatsApp 🟢')}
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

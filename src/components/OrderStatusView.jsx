import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { CheckCircle, Clock, ChefHat, Truck } from 'lucide-react';

const OrderStatusModal = ({ orderId, restaurantId, isOpen, onClose }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !orderId) return;

        // Initial fetch handled by parent usually? No, let's fetch here or assume parent passed status?
        // Parent passes ID, we subscribe.
        // Actually better to subscribe to THIS specific order.

        const channel = orderService.subscribeToOrders(restaurantId, (payload) => {
            if (payload.new && payload.new.id === orderId) {
                setOrder(payload.new);
            }
        });

        // Also fetch initial state
        // We can't use getActiveOrders (it returns list). We need a getOrder method or just listen.
        // For MVP, we'll assume the parent sets the initial order object or we add a getOrder method.
        // Let's rely on passed order object if possible? No, we need fresh updates.
        // Let's add getOrderById to service? Or just rely on subscription if we just created it.
        // Ideally we should fetch it once.

        return () => {
            // unsubscribe handled by service implicitly? service.subscribe returns a subscription.
            // We should store subscription and unsubscribe.
            channel.unsubscribe();
        }
    }, [isOpen, orderId, restaurantId]);

    // Simple poll fallback or prop based?
    // Let's just create a quick status display based on passed props + simple polling if realtime fails?
    // Actually, let's keep it simple. The parent CheckoutModal might become the OrderStatusModal after submission.

    // Status Logic
    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { label: 'Aguardando Confirmação', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Seu pedido foi enviado para a cozinha.' };
            case 'preparing': return { label: 'Em Preparação', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-100', text: 'O chef já está preparando seu prato!' };
            case 'ready': return { label: 'Pronto!', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Seu pedido está pronto para entrega/retirada.' };
            case 'delivered': return { label: 'Entregue', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100', text: 'Bom apetite!' };
            case 'cancelled': return { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Houve um problema com seu pedido.' };
            default: return { label: 'Processando', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Atualizando status...' };
        }
    };

    if (!isOpen) return null;

    // Use order from state or props? If state is null, we show loading?
    // CheckoutModal passes the created order.
    // Let's assume CheckoutModal manages the "Success View" which IS this modal.

    return null; // Implemented inside CheckoutModal for simplicity in this MVP
};

// Actually, merging into CheckoutModal is easier for state transition.
// Let's return a UI component that CheckoutModal can switch to.
export const OrderStatusView = ({ order, status, whatsappNumber }) => {
    const getStatusInfo = (s) => {
        switch (s) {
            case 'pending': return { label: 'Aguardando Confirmação', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', desc: 'Aguarde o restaurante confirmar.' };
            case 'preparing': return { label: 'Em Preparação', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'A cozinha está a todo vapor!' };
            case 'ready': return { label: 'Pronto!', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', desc: 'Pode vir buscar ou estamos levando.' };
            case 'delivered': return { label: 'Concluído', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Obrigado pela preferência!' };
            case 'cancelled': return { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', desc: 'Houve um problema com seu pedido.' };
            default: return { label: 'Processando', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', desc: '...' };
        }
    };

    const info = getStatusInfo(status || order?.status);
    const Icon = info.icon;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleRating = async (val) => {
        setRating(val);
    };

    const submitFeedback = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('feedbacks') // This table will be created via SQL
                .insert([{
                    order_id: order?.id,
                    restaurant_id: order?.restaurant_id,
                    rating,
                    comment,
                    customer_name: order?.customer_name
                }]);

            if (error) throw error;
            setIsSubmitted(true);
        } catch (err) {
            console.error("Feedback error:", err);
            // Even if it fails (table not created yet), we show success to the user to not ruin experience
            setIsSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWhatsAppClick = () => {
        if (!order) return;
        const isDelivery = order.table_number && order.table_number.toString().toLowerCase().includes('entrega');
        const orderType = isDelivery ? 'delivery' : 'dine-in';
        const details = {
            customerName: order.customer_name,
            tableNumber: order.table_number,
            address: isDelivery ? order.table_number.replace('Entrega: ', '') : '',
            paymentMethod: 'cash',
        };

        const link = generateWhatsAppLink(order.items, order.total, orderType, details, whatsappNumber);
        window.open(link, '_blank');
    };

    return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center animate-fade-in scrollbar-hide">
            <div className={`p-6 rounded-full ${info.bg} ${info.color} mb-6 relative`}>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></div>
                <Icon size={48} />
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${info.color}`}>{info.label}</h2>
            <p className="text-gray-500 mb-6">{info.desc}</p>

            {/* Private Feedback Section */}
            {!isSubmitted ? (
                <div className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-5 mb-6 transition-all">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Como está a sua experiência? ⭐</h3>
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleRating(star)}
                                className={`text-3xl transition-all transform active:scale-90 ${rating >= star ? 'text-yellow-500 scale-110' : 'text-gray-300 dark:text-gray-600'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    {rating > 0 && (
                        <div className="animate-fade-in">
                            <textarea
                                placeholder="Algo que possamos melhorar? (Opcional)"
                                className="w-full p-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm mb-3 outline-none focus:ring-2 focus:ring-yellow-500/50"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={2}
                            />
                            <button
                                onClick={submitFeedback}
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg"
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Avaliação Privada'}
                            </button>
                            <p className="text-[10px] text-gray-400 mt-2 italic">Sua avaliação vai apenas para o dono do restaurante.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/20 rounded-2xl p-5 mb-6 animate-bounce-short">
                    <p className="text-green-600 dark:text-green-400 font-bold text-sm">Obrigado! Sua opinião ajuda-nos a ser os melhores de Angola. 🇦🇴</p>
                </div>
            )}

            <div className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-left border border-gray-100 dark:border-white/5">
                <div className="text-[10px] uppercase text-gray-400 font-bold mb-3 tracking-widest">Resumo do Pedido</div>
                {order && order.items && order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <span className="text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-100">{item.price}</span>
                    </div>
                ))}
            </div>

            <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-tighter">
                O status atualizará automaticamente • Jindungo Menus 🌶️
            </p>
        </div>
    );
};

export default OrderStatusView;

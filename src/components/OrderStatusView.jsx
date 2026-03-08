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

    const handleWhatsAppClick = () => {
        if (!order) return;

        // Reconstruction of details for the generator
        // This is a best-effort since we might not have all original form fields (like changeFor) stored in the order object unless we added columns.
        // Assuming order.table_number contains string "Entrega: ..." for delivery.
        const isDelivery = order.table_number && order.table_number.toString().toLowerCase().includes('entrega');
        const orderType = isDelivery ? 'delivery' : 'dine-in';

        const details = {
            customerName: order.customer_name,
            tableNumber: order.table_number,
            address: isDelivery ? order.table_number.replace('Entrega: ', '') : '',
            paymentMethod: 'cash', // Default fallback or we need to store this in DB
        };

        const link = generateWhatsAppLink(order.items, order.total, orderType, details, whatsappNumber);
        window.open(link, '_blank');
    };

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-fade-in">
            <div className={`p-6 rounded-full ${info.bg} ${info.color} mb-6 relative`}>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current"></div>
                <Icon size={48} />
            </div>

            <h2 className={`text-2xl font-bold mb-2 ${info.color}`}>{info.label}</h2>
            <p className="text-gray-500 mb-8">{info.desc}</p>

            <div className="w-full bg-gray-100 rounded-lg p-4 text-left">
                <div className="text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">Seu Pedido</div>
                {order && order.items && order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold text-gray-600">{item.price}</span>
                    </div>
                ))}
            </div>

            <p className="mt-6 text-xs text-gray-400">
                O status atualizará automaticamente.
            </p>
        </div>
    );
};

export default OrderStatusView;

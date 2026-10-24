import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { isNotificationSupported, sendNotification } from '../utils/notificationHelper';
import { audioAlertService } from '../utils/audioAlertService';

export const useRealtimeOrders = (restaurantId, onNewOrderCallback, isAudioEnabled = true) => {
    const processedIdsRef = useRef(new Set());

    const handleIncomingOrder = useCallback((newOrder) => {
        if (!newOrder || !newOrder.id) return;
        
        // Evitar disparo duplicado do mesmo pedido
        if (processedIdsRef.current.has(newOrder.id)) return;
        processedIdsRef.current.add(newOrder.id);

        // Manter o Set limpo (máx 100 pedidos recentes em cache)
        if (processedIdsRef.current.size > 100) {
            const firstId = processedIdsRef.current.values().next().value;
            processedIdsRef.current.delete(firstId);
        }

        const isDelivery = newOrder.table_number?.includes('Entrega:') || newOrder.order_type === 'delivery';

        // 1. Tocar som INSTANTANEAMENTE (Zero Latency com Web Audio Buffer)
        if (isAudioEnabled) {
            audioAlertService.play(1.0);
        }

        // 2. Notificação Visual e no Sistema Operativo
        if (!isDelivery) {
            toast(`🛎️ NOVO PEDIDO NA MESA!\nCliente: ${newOrder.customer_name || 'Desconhecido'}\nMesa: ${newOrder.table_number?.split('|')[0] || '?'}`, {
                duration: 8000,
                position: 'top-center',
                style: { background: '#D4AF37', color: '#000', border: '2px solid #000', fontWeight: 'bold', textAlign: 'center' }
            });

            if (isNotificationSupported() && Notification?.permission === 'granted') {
                sendNotification("🛎️ Novo Pedido Na Mesa!", {
                    body: `${newOrder.customer_name || 'Cliente'} - ${newOrder.table_number?.split('|')[0]}`,
                    icon: '/jindungo_logo_v3.png'
                });
            }
        } else {
            toast.success(`🛎️ NOVO PEDIDO DELIVERY!\nCliente: ${newOrder.customer_name || 'Cliente'}`, {
                duration: 8000,
                position: 'top-right',
                style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
            });

            if (isNotificationSupported() && Notification?.permission === 'granted') {
                sendNotification("🛎️ Novo Pedido Delivery!", {
                    body: `Cliente: ${newOrder.customer_name || 'Desconhecido'}`,
                    icon: '/jindungo_logo_v3.png'
                });
            }
        }

        // 3. Callback imediato para atualização da interface KDS
        if (onNewOrderCallback) {
            onNewOrderCallback(newOrder);
        }
    }, [isAudioEnabled, onNewOrderCallback]);

    useEffect(() => {
        if (!restaurantId) return;

        // Pré-desbloquear áudio se possível
        audioAlertService.unlock();

        // Escuta direta via Supabase Realtime
        const ordersChannel = supabase.channel(`kitchen-orders-${restaurantId}`, {
            config: { broadcast: { self: true }, presence: { key: restaurantId } }
        })
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders', 
                filter: `restaurant_id=eq.${restaurantId}` 
            }, 
            (payload) => {
                handleIncomingOrder(payload.new);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[useRealtimeOrders] Ligação Realtime KDS ativa para o restaurante: ${restaurantId}`);
                }
            });

        // Escuta local ultrarrápida (0ms se o pedido for originado na mesma máquina/rede local)
        const localHandler = (e) => {
            if (e.detail && (e.detail.restaurant_id === restaurantId || !e.detail.restaurant_id)) {
                handleIncomingOrder(e.detail);
            }
        };
        window.addEventListener('jindungo_order_created', localHandler);

        return () => {
            window.removeEventListener('jindungo_order_created', localHandler);
            supabase.removeChannel(ordersChannel);
        };
    }, [restaurantId, handleIncomingOrder]);
};

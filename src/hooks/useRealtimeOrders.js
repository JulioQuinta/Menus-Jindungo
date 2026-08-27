import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { isNotificationSupported, sendNotification } from '../utils/notificationHelper';

// Global Audio instance to prevent repeated allocation and browser lag
const orderAlertSound = new Audio('/bell.mp3');
orderAlertSound.volume = 0.8; // A bit louder for new orders

export const useRealtimeOrders = (restaurantId, onNewOrderCallback, isAudioEnabled = true) => {

    const playOrderSound = useCallback(() => {
        try {
            orderAlertSound.currentTime = 0;
            orderAlertSound.play().catch(e => console.log("Audio autoplay blocked", e));
        } catch (err) {
            console.error('Audio error', err);
        }
    }, []);

    useEffect(() => {
        if (!restaurantId) return;

        const ordersChannel = supabase.channel(`kitchen-orders-${restaurantId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders', 
                filter: `restaurant_id=eq.${restaurantId}` 
            }, 
            (payload) => {
                const newOrder = payload.new;
                const isDelivery = newOrder.table_number?.includes('Entrega:');
                
                // Dispara som para todos os novos pedidos se áudio estiver ativado
                if (isAudioEnabled) {
                    playOrderSound();
                }

                if (!isDelivery) {
                    toast(`🛎️ NOVO PEDIDO NA MESA!\nCliente: ${newOrder.customer_name || 'Desconhecido'}\nMesa: ${newOrder.table_number?.split('|')[0] || '?'}`, {
                        duration: 8000,
                        position: 'top-center',
                        style: { background: '#D4AF37', color: '#000', border: '2px solid #000', fontWeight: 'bold', textAlign: 'center' }
                    });

                    // Notificação de SO se suportada
                    if (isNotificationSupported() && Notification?.permission === 'granted') {
                        sendNotification("🛎️ Novo Pedido Na Mesa!", {
                            body: `${newOrder.customer_name || 'Cliente'} - ${newOrder.table_number?.split('|')[0]}`,
                            icon: '/jindungo_logo_v3.png'
                        });
                    }
                } else {
                    // Para delivery dispara toast e notificação de SO
                    toast.success(`🛎️ NOVO PEDIDO DELIVERY!\nCliente: ${newOrder.customer_name || 'Cliente'}`, {
                        duration: 8000,
                        position: 'top-right',
                        style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
                    });

                    // Notificação de SO se suportada
                    if (isNotificationSupported() && Notification?.permission === 'granted') {
                        sendNotification("🛎️ Novo Pedido Delivery!", {
                            body: `Cliente: ${newOrder.customer_name || 'Desconhecido'}`,
                            icon: '/jindungo_logo_v3.png'
                        });
                    }
                }

                // Callback para atualizar a UI (e.g. adicionar ao topo da lista no KitchenBoard)
                if (onNewOrderCallback) {
                    onNewOrderCallback(newOrder);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
        };
    }, [restaurantId, onNewOrderCallback, playOrderSound, isAudioEnabled]);

};

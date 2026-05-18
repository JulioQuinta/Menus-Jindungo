import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isNotificationSupported, sendNotification } from '../utils/notificationHelper';
import toast from 'react-hot-toast';

// Global Audio instance to prevent repeated allocation and browser lag
const notificationSound = new Audio('/bell.mp3');
notificationSound.volume = 0.5;

export const useAdminAlerts = (restaurantId, navigate) => {
    const [activeAlerts, setActiveAlerts] = useState([]);
    const lastAlertTime = useRef(0);

    // Optimized Sound Player (Debounced to prevent stuttering)
    const playAlertSound = useCallback(() => {
        const now = Date.now();
        if (now - lastAlertTime.current < 2000) return; // Prevent sound spam
        
        lastAlertTime.current = now;
        notificationSound.currentTime = 0;
        notificationSound.play().catch(e => console.log("Audio autoplay blocked", e));
    }, []);

    const fetchPendingAlerts = useCallback(async () => {
        if (!restaurantId) return;
        const { data } = await supabase
            .from('notificacoes_garcom')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('status', 'pendente');
        if (data) setActiveAlerts(data);
    }, [restaurantId]);

    const handleDismissAlert = useCallback(async (id) => {
        setActiveAlerts(prev => prev.filter(a => a.id !== id));

        // Use a timeout or local variable to handle the side effect after the state update
        // Since setActiveAlerts is async-ish in terms of when 'alertToDismiss' is set, 
        // it's safer to capture it or use a separate state check if needed.
        // However, for navigation, we can just use the ID pattern.
        
        if (id.startsWith('order-')) {
            navigate('/admin/orders');
        } else if (id.startsWith('res-')) {
            navigate('/admin/reservations');
        } else {
            await supabase
                .from('notificacoes_garcom')
                .update({ status: 'atendido' })
                .eq('id', id);
        }
    }, [navigate]);

    useEffect(() => {
        if (!restaurantId) return;

        fetchPendingAlerts();

        const waiterChannel = supabase.channel('waiter-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes_garcom', filter: `restaurant_id=eq.${restaurantId}` }, 
            (payload) => {
                playAlertSound();
                setActiveAlerts(prev => [...prev, payload.new]);
                toast.success(`🔔 CHAMADA DE MESA!\nMesa ${payload.new.mesa_id || '?'} solicitou atendimento!`, {
                    duration: 10000,
                    position: 'top-center',
                    style: { background: '#ef4444', color: '#fff', border: '2px solid #b91c1c', fontWeight: 'bold', fontSize: '16px', padding: '16px', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.5)' }
                });
                if (isNotificationSupported() && Notification?.permission === 'granted') {
                    sendNotification("🔔 Chamada de Mesa Jindungo!", {
                        body: `A Mesa ${payload.new.mesa_id || '?'} solicitou um empregado de mesa!`,
                        icon: '/jindungo_logo_v3.png'
                    });
                }
            })
            .subscribe();

        const ordersChannel = supabase.channel('new-orders-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, 
            (payload) => {
                playAlertSound();
                const newOrderAlert = {
                    id: `order-${payload.new.id}`,
                    isOrder: true,
                    mesa_id: 'Online',
                    request_type: `De: ${payload.new.customer_name || 'Cliente Desconhecido'}`,
                    created_at: payload.new.created_at
                };
                setActiveAlerts(prev => [...prev, newOrderAlert]);

                if (isNotificationSupported() && Notification?.permission === 'granted') {
                    sendNotification("Novo Pedido Jindungo!", {
                        body: `De: ${payload.new.customer_name || 'Cliente'} - ${payload.new.total} Kz`,
                        icon: '/jindungo_logo_v3.png'
                    });
                }
            })
            .subscribe();

        const reservationsChannel = supabase.channel('new-reservations-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` }, 
            (payload) => {
                playAlertSound();
                const newResAlert = {
                    id: `res-${payload.new.id}`,
                    isReservation: true,
                    mesa_id: `${payload.new.num_tables} Mesas`,
                    request_type: `Reserva: ${payload.new.customer_name}`,
                    created_at: payload.new.created_at
                };
                setActiveAlerts(prev => [...prev, newResAlert]);
                toast.success(`Nova Reserva de ${payload.new.customer_name}!`, { icon: '📅', duration: 6000 });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(waiterChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(reservationsChannel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId, playAlertSound]);

    return { activeAlerts, handleDismissAlert, playAlertSound };
};

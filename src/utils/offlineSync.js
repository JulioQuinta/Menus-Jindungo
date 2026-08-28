import { orderService } from '../services/orderService';
import toast from 'react-hot-toast';

// Helper to generate a fast and safe local unique ID
export const generateTempId = () => {
    return 'offline-order-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
};

// Queue an order in localStorage
export const queueOfflineOrder = (orderData) => {
    const tempId = generateTempId();
    const offlineOrderObj = {
        id: tempId,
        orderData,
        timestamp: Date.now()
    };

    let queue = [];
    const existingQueue = localStorage.getItem('jindungo_offline_orders_queue');
    if (existingQueue) {
        try {
            queue = JSON.parse(existingQueue);
        } catch (e) {
            queue = [];
        }
    }

    queue.push(offlineOrderObj);
    localStorage.setItem('jindungo_offline_orders_queue', JSON.stringify(queue));
    
    // Store this as the active offline pending tracking order
    localStorage.setItem('jindungo_active_order_offline_pending', JSON.stringify(offlineOrderObj));

    return tempId;
};

// Synchronize all queued offline orders with Supabase
export const syncOfflineOrders = async () => {
    const queueStr = localStorage.getItem('jindungo_offline_orders_queue');
    if (!queueStr) return;

    let queue = [];
    try {
        queue = JSON.parse(queueStr);
    } catch (e) {
        return;
    }

    if (queue.length === 0) return;

    console.log(`[Offline Sync] Iniciando sincronização de ${queue.length} encomendas offline...`);
    const remainingQueue = [];

    for (const offlineOrder of queue) {
        try {
            // Attempt to send the order to Supabase
            const { data, error } = await orderService.createOrder(offlineOrder.orderData);
            
            if (error) {
                // If it is a stock or constraint validation failure, discard to prevent infinite loop
                if (error.message && (error.message.includes('stock') || error.message.includes('Security') || error.message.includes('Estoque'))) {
                    console.error("[Offline Sync] Erro permanente detetado, descartando pedido offline:", error.message);
                    continue;
                }
                throw error;
            }

            console.log(`[Offline Sync] Encomenda offline ${offlineOrder.id} sincronizada! Novo ID: ${data.id}`);

            // If this is currently the active order being tracked by the customer, update references
            const activeOffline = localStorage.getItem('jindungo_active_order_offline_pending');
            if (activeOffline) {
                try {
                    const parsed = JSON.parse(activeOffline);
                    if (parsed.id === offlineOrder.id) {
                        // Switch tracking context from offline placeholder to real Leaflet Live Tracker
                        localStorage.setItem(`jindungo_active_order_${offlineOrder.orderData.restaurant_id}`, JSON.stringify({
                            id: data.id,
                            timestamp: Date.now()
                        }));
                        localStorage.removeItem('jindungo_active_order_offline_pending');

                        // Notify ActiveOrderTracker
                        window.dispatchEvent(new Event('jindungo_new_order'));

                        // Golden Toast alert
                        toast.success("🛎️ A sua encomenda offline foi sincronizada com sucesso e enviada para a cozinha do restaurante!", {
                            icon: '⚡',
                            duration: 7000,
                            style: {
                                background: '#121213',
                                color: '#fff',
                                borderRadius: '20px',
                                border: '1px solid #D4AF37',
                                fontFamily: 'serif',
                                padding: '16px 20px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
                                fontSize: '13px',
                                fontWeight: '600'
                            }
                        });

                        // Redirect to the live tracking page if they are on the placeholder offline page
                        if (window.location.pathname.includes(offlineOrder.id)) {
                            window.location.href = `/track/${data.id}`;
                        }
                    }
                } catch (e) {
                    console.error("Erro ao atualizar dados de tracking offline:", e);
                }
            }
        } catch (err) {
            console.error(`[Offline Sync] Falha ao sincronizar encomenda offline ${offlineOrder.id}:`, err);
            remainingQueue.push(offlineOrder);
        }
    }

    if (remainingQueue.length > 0) {
        localStorage.setItem('jindungo_offline_orders_queue', JSON.stringify(remainingQueue));
    } else {
        localStorage.removeItem('jindungo_offline_orders_queue');
        console.log("[Offline Sync] Sincronização offline concluída com sucesso!");
    }
};

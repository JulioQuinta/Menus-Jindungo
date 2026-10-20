import { db, offlineDb } from '../lib/offlineDb';
import { supabase } from '../lib/supabaseClient';

const VALID_ORDER_COLUMNS = [
    'id', 'restaurant_id', 'items', 'total', 'status', 'customer_name',
    'table_number', 'created_at', 'customer_phone', 'rejection_reason',
    'coupon_id', 'coupon_code', 'coupon_discount', 'is_loyalty_redemption',
    'loyalty_reward_text', 'staff_member_id', 'staff_member_name', 'order_type',
    'delivery_address', 'delivery_neighborhood', 'delivery_reference',
    'delivery_fee', 'takeaway_time', 'courier_name', 'courier_phone',
    'dispatched_at', 'courier_latitude', 'courier_longitude',
    'invoice_status', 'invoice_number', 'request_id', 'jws_hash', 'validation_code'
];

function sanitizeOrderForSupabase(raw) {
    const clean = {};
    for (const key of VALID_ORDER_COLUMNS) {
        if (raw[key] !== undefined) {
            clean[key] = raw[key];
        }
    }
    if (typeof clean.id === 'string' && (clean.id.startsWith('off-') || clean.id.startsWith('POS-'))) {
        delete clean.id;
    }
    return clean;
}

class SyncEngine {
    constructor() {
        this.isSyncing = false;
        this.subscribers = new Set();

        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('[SyncEngine] Ligação à internet detetada. A iniciar sincronização...');
                this.syncPendingData();
            });
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(pendingCount) {
        this.subscribers.forEach(cb => {
            try {
                cb(pendingCount);
            } catch (e) {
                console.error('[SyncEngine] Erro ao notificar subscritor:', e);
            }
        });
    }

    async isOnline() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return false;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const { error } = await supabase
                .from('restaurants')
                .select('id')
                .limit(1)
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);
            return !error;
        } catch {
            return false;
        }
    }

    async syncPendingData(restaurantId = null) {
        if (this.isSyncing) {
            return { success: false, reason: 'ALREADY_SYNCING' };
        }

        const online = await this.isOnline();
        if (!online) {
            return { success: false, reason: 'OFFLINE' };
        }

        this.isSyncing = true;
        let syncedCount = 0;
        let failedCount = 0;

        try {
            let pendingItems = await db.sync_queue
                .where('status')
                .equals('pending')
                .toArray();

            if (restaurantId) {
                pendingItems = pendingItems.filter(item => item.payload && item.payload.restaurant_id === restaurantId);
            }

            const BATCH_SIZE = 15;
            for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
                const batch = pendingItems.slice(i, i + BATCH_SIZE);

                for (const item of batch) {
                    try {
                        const success = await this.syncOrderRecord(item.payload);
                        if (success) {
                            await db.sync_queue.update(item.id, { status: 'synced', synced_at: new Date().toISOString() });
                            if (item.offline_uuid) {
                                await db.orders.update(item.offline_uuid, { sync_status: 'synced' });
                            }
                            syncedCount++;
                        } else {
                            const newRetryCount = (item.retry_count || 0) + 1;
                            await db.sync_queue.update(item.id, { 
                                retry_count: newRetryCount,
                                status: newRetryCount >= 2 ? 'failed' : 'pending' 
                            });
                            failedCount++;
                        }
                    } catch (err) {
                        console.error(`[SyncEngine] Erro ao sincronizar item #${item.id}:`, err);
                        failedCount++;
                    }
                }
            }

            const remainingPending = await offlineDb.getPendingSyncCount(restaurantId);
            this.notifySubscribers(remainingPending);

            return { success: syncedCount > 0 || failedCount === 0, syncedCount, failedCount };
        } catch (globalErr) {
            console.error('[SyncEngine] Falha global na sincronização:', globalErr);
            return { success: false, error: globalErr };
        } finally {
            this.isSyncing = false;
        }
    }

    async syncOrderRecord(orderPayload) {
        if (!orderPayload || !orderPayload.restaurant_id) {
            return true;
        }
        try {
            const cleanOrder = sanitizeOrderForSupabase(orderPayload);

            const { error } = await supabase
                .from('orders')
                .insert([cleanOrder]);

            if (!error || error.code === '23505') return true;

            const minimalOrder = {
                restaurant_id: cleanOrder.restaurant_id,
                table_number: cleanOrder.table_number || 'Balcão',
                items: Array.isArray(cleanOrder.items) ? cleanOrder.items : [],
                total: Number(cleanOrder.total) || 0,
                status: cleanOrder.status || 'paid',
                customer_name: cleanOrder.customer_name || 'Consumidor Final',
                customer_phone: cleanOrder.customer_phone || '',
                created_at: cleanOrder.created_at || new Date().toISOString()
            };

            const { error: fallbackError } = await supabase
                .from('orders')
                .insert([minimalOrder]);

            if (fallbackError && fallbackError.code !== '23505') {
                console.error('[SyncEngine] Erro no insert Supabase (fallback):', fallbackError);
                return false;
            }

            return true;
        } catch (e) {
            console.error('[SyncEngine] Exceção ao enviar pedido:', e);
            return false;
        }
    }
}

export const syncEngine = new SyncEngine();

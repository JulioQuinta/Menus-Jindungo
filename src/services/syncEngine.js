import { db, offlineDb } from '../lib/offlineDb';
import { supabase } from '../lib/supabaseClient';

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

    // Registar subscrições para atualizações de contagem de pendências UI
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

    // Verificar se existe ligação ativa à cloud Supabase
    async isOnline() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return false;
        }
        try {
            // Ping rápido à Supabase com timeout de 3s
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const { error } = await supabase
                .from('app_settings')
                .select('key')
                .limit(1)
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);
            return !error;
        } catch {
            return false;
        }
    }

    // Sincronizar todos os dados pendentes acumulados (Processamento por lotes / Batching)
    async syncPendingData(restaurantId = null) {
        if (this.isSyncing) {
            console.log('[SyncEngine] Sincronização já em curso. A aguardar...');
            return { success: false, reason: 'ALREADY_SYNCING' };
        }

        const online = await this.isOnline();
        if (!online) {
            console.log('[SyncEngine] Sem acesso à internet/cloud. Sincronização adiada.');
            return { success: false, reason: 'OFFLINE' };
        }

        this.isSyncing = true;
        let syncedCount = 0;
        let failedCount = 0;

        try {
            console.log('[SyncEngine] A iniciar sincronização em lote da fila offline...');

            // Obter todos os itens pendentes da fila
            let pendingItems = await db.sync_queue
                .where('status')
                .equals('pending')
                .toArray();

            if (restaurantId) {
                pendingItems = pendingItems.filter(item => item.payload && item.payload.restaurant_id === restaurantId);
            }

            console.log(`[SyncEngine] Total de registos pendentes a enviar: ${pendingItems.length}`);

            // Processar em lotes de 15 faturas por vez
            const BATCH_SIZE = 15;
            for (let i = 0; i < pendingItems.length; i += BATCH_SIZE) {
                const batch = pendingItems.slice(i, i + BATCH_SIZE);

                for (const item of batch) {
                    try {
                        let success = false;
                        if (item.action === 'create_order') {
                            success = await this.syncOrderRecord(item.payload);
                        }

                        if (success) {
                            // Marcar item na fila como sincronizado
                            await db.sync_queue.update(item.id, { status: 'synced', synced_at: new Date().toISOString() });
                            
                            // Atualizar estado no banco de dados offline
                            if (item.offline_uuid) {
                                await db.orders.update(item.offline_uuid, { sync_status: 'synced' });
                            }
                            syncedCount++;
                        } else {
                            const newRetryCount = (item.retry_count || 0) + 1;
                            await db.sync_queue.update(item.id, { 
                                retry_count: newRetryCount,
                                status: newRetryCount > 10 ? 'failed' : 'pending' 
                            });
                            failedCount++;
                        }
                    } catch (err) {
                        console.error(`[SyncEngine] Erro ao sincronizar item #${item.id}:`, err);
                        failedCount++;
                    }
                }
            }

            // Notificar UI sobre a contagem atualizada
            const remainingPending = await offlineDb.getPendingSyncCount(restaurantId);
            this.notifySubscribers(remainingPending);

            console.log(`[SyncEngine] Concluído! Sincronizados: ${syncedCount}, Falhas: ${failedCount}`);
            return { success: true, syncedCount, failedCount };
        } catch (globalErr) {
            console.error('[SyncEngine] Falha global na sincronização:', globalErr);
            return { success: false, error: globalErr };
        } finally {
            this.isSyncing = false;
        }
    }

    // Enviar registo de ordem individual com desduplicação por offline_uuid
    async syncOrderRecord(orderPayload) {
        try {
            // Remover propriedades locais temporárias antes de subir para a Supabase
            const { is_offline_created, sync_status, ...orderToInsert } = orderPayload;

            // Fazer upsert no Supabase usando offline_uuid se existir, ou insert simples
            const { error } = await supabase
                .from('orders')
                .upsert([orderToInsert], { onConflict: 'offline_uuid', ignoreDuplicates: false });

            if (error) {
                console.error('[SyncEngine] Erro no upsert Supabase:', error);
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

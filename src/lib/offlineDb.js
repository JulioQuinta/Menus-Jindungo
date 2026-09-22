import Dexie from 'dexie';

// 1. Inicialização do Banco de Dados Offline Dexie
export const db = new Dexie('MenusJindungoOfflineDB');

// Definição do Schema e Tabelas IndexedDB
db.version(1).stores({
    orders: 'offline_uuid, id, restaurant_id, created_at, status, sync_status, invoice_number',
    products: 'id, restaurant_id, category_id, name, price, stock, updated_at',
    categories: 'id, restaurant_id, name, order_index',
    staff: 'id, restaurant_id, pin, role, name',
    inventory_logs: 'id, product_id, change_qty, created_at, sync_status',
    sync_queue: '++id, offline_uuid, type, action, payload, status, retry_count, created_at',
    app_state: 'key, value'
});

// 2. Garantia de Armazenamento Persistente (Previne purga pelo browser/OS)
export async function ensurePersistentStorage() {
    try {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persisted();
            if (!isPersisted) {
                const result = await navigator.storage.persist();
                console.log(`[OfflineDB] Solicitação de Armazenamento Persistente: ${result ? 'CONCEDIDO' : 'NEGADO'}`);
                return result;
            }
            console.log('[OfflineDB] Armazenamento Persistente já está ATIVO.');
            return true;
        }
    } catch (error) {
        console.warn('[OfflineDB] Erro ao verificar armazenamento persistente:', error);
    }
    return false;
}

// 3. Utilitários da Base de Dados Offline
export const offlineDb = {
    // Solicitar persistência ao arrancar
    init() {
        ensurePersistentStorage();
    },

    // Gerar UUID v4 para identificação unívoca de faturas/pedidos offline
    generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'off-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    },

    // Obter ou incrementar sequencial fiscal offline (Ex: FT 2026/OFFLINE-00001)
    async getNextInvoiceNumber(restaurantId) {
        const year = new Date().getFullYear();
        const key = `invoice_seq_${restaurantId}_${year}`;
        
        let seqItem = await db.app_state.get(key);
        let currentSeq = seqItem ? parseInt(seqItem.value, 10) : 0;
        let nextSeq = currentSeq + 1;
        
        await db.app_state.put({ key, value: nextSeq });
        
        const paddedSeq = String(nextSeq).padStart(5, '0');
        return `FT JIN${year}/OFFLINE-${paddedSeq}`;
    },

    // Gravar novo pedido/fatura localmente + Adicionar à Fila de Sincronização
    async saveOfflineOrder(orderData) {
        const offlineUuid = orderData.offline_uuid || this.generateUUID();
        const invoiceNumber = orderData.invoice_number || await this.getNextInvoiceNumber(orderData.restaurant_id);

        const orderRecord = {
            ...orderData,
            offline_uuid: offlineUuid,
            invoice_number: invoiceNumber,
            sync_status: 'pending', // pending, synced, failed
            created_at: orderData.created_at || new Date().toISOString(),
            is_offline_created: true
        };

        await db.transaction('rw', db.orders, db.sync_queue, db.products, async () => {
            // 1. Gravar Fatura localmente
            await db.orders.put(orderRecord);

            // 2. Adicionar item à Fila de Sincronização
            await db.sync_queue.add({
                offline_uuid: offlineUuid,
                type: 'ORDER_CREATE',
                action: 'create_order',
                payload: orderRecord,
                status: 'pending',
                retry_count: 0,
                created_at: new Date().toISOString()
            });

            // 3. Abater stock local se houver itens no pedido
            if (Array.isArray(orderRecord.items)) {
                for (const item of orderRecord.items) {
                    if (item.product_id || item.id) {
                        const prodId = item.product_id || item.id;
                        const prod = await db.products.get(prodId);
                        if (prod && typeof prod.stock === 'number') {
                            const newStock = Math.max(0, prod.stock - (item.quantity || 1));
                            await db.products.update(prodId, { stock: newStock });
                        }
                    }
                }
            }
        });

        console.log(`[OfflineDB] Fatura offline ${invoiceNumber} gravada com sucesso! UUID: ${offlineUuid}`);
        return orderRecord;
    },

    // Obter número de faturas pendentes de sincronização
    async getPendingSyncCount(restaurantId) {
        try {
            if (!restaurantId) return 0;
            return await db.sync_queue
                .where('status')
                .equals('pending')
                .filter(item => item.payload && item.payload.restaurant_id === restaurantId)
                .count();
        } catch (e) {
            console.error('[OfflineDB] Erro ao contar pendências:', e);
            return 0;
        }
    },

    // Cache de produtos e categorias
    async cacheProducts(products) {
        if (!Array.isArray(products)) return;
        await db.products.bulkPut(products);
    },

    async cacheCategories(categories) {
        if (!Array.isArray(categories)) return;
        await db.categories.bulkPut(categories);
    },

    async cacheStaff(staffMembers) {
        if (!Array.isArray(staffMembers)) return;
        await db.staff.bulkPut(staffMembers);
    },

    // Obter produtos locais offline
    async getLocalProducts(restaurantId) {
        return await db.products.where('restaurant_id').equals(restaurantId).toArray();
    },

    // Validar PIN de funcionário offline
    async validateStaffPin(restaurantId, pin) {
        const staff = await db.staff
            .where('restaurant_id')
            .equals(restaurantId)
            .filter(s => String(s.pin) === String(pin))
            .first();
        return staff || null;
    }
};

// Auto-inicializar no import
offlineDb.init();

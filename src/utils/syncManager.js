import { supabase } from '../lib/supabaseClient';
import { localDbService } from '../lib/localDb';
import { orderService } from '../services/orderService';

export const syncManager = {
    // 1. PULL: Sync from Supabase to Local Dexie DB
    async syncDownstream(restaurantSlug) {
        if (!restaurantSlug) return { success: false, error: 'Slug do restaurante em falta' };

        try {
            console.log(`[Sync Downstream] A iniciar descarregamento para o slug: ${restaurantSlug}`);
            
            // Fetch restaurant + categories + menu items from Supabase
            const { data: restaurants, error: rError } = await supabase
                .from('restaurants')
                .select(`
                    id, 
                    name, 
                    slug, 
                    status, 
                    plan, 
                    delivery_config, 
                    theme_config,
                    business_info,
                    categories (
                        id, 
                        label, 
                        sort_order,
                        menu_items (*)
                    )
                `)
                .eq('slug', restaurantSlug);

            if (rError) throw rError;
            if (!restaurants || restaurants.length === 0) {
                throw new Error('Restaurante não encontrado no servidor Supabase');
            }

            const restaurant = restaurants[0];

            // 1.1 Save Restaurant meta
            const restaurantMeta = {
                id: restaurant.id,
                name: restaurant.name,
                slug: restaurant.slug,
                status: restaurant.status,
                plan: restaurant.plan,
                delivery_config: restaurant.delivery_config,
                theme_config: restaurant.theme_config,
                business_info: restaurant.business_info
            };
            await localDbService.saveRestaurant(restaurantMeta);

            // 1.2 Extract and save Categories
            const categories = restaurant.categories || [];
            const categoriesList = categories.map(cat => ({
                id: cat.id,
                restaurant_id: restaurant.id,
                label: cat.label,
                sort_order: cat.sort_order || 0
            }));
            await localDbService.saveCategories(categoriesList);

            // 1.3 Extract and save Menu Items
            const itemsList = [];
            categories.forEach(cat => {
                const items = cat.menu_items || [];
                items.forEach(item => {
                    itemsList.push({
                        id: item.id,
                        category_id: cat.id,
                        restaurant_id: restaurant.id,
                        name: item.name,
                        price: item.price,
                        desc_text: item.desc_text,
                        img_url: item.img_url,
                        subcategory: item.subcategory,
                        composition: item.composition,
                        is_highlight: item.is_highlight,
                        badge: item.badge,
                        track_stock: item.track_stock,
                        stock_quantity: item.stock_quantity,
                        upsell_ids: item.upsell_ids || []
                    });
                });
            });
            await localDbService.saveMenuItems(itemsList);

            // 1.4 Mark last sync success timestamp
            await localDbService.setSyncMeta('last_synced_at', Date.now());
            console.log('[Sync Downstream] Sincronização local concluída com sucesso!');
            return { success: true, restaurantId: restaurant.id };

        } catch (e) {
            console.error('[Sync Downstream] Falha ao sincronizar dados da nuvem para a base local:', e);
            return { success: false, error: e.message };
        }
    },

    // 2. PUSH: Sync local unsynced orders/invoices to Supabase
    async syncUpstream(restaurantId) {
        if (!restaurantId) return { success: false, error: 'restaurantId em falta' };

        try {
            const unsyncedOrders = await localDbService.getUnsyncedOrders(restaurantId);
            if (unsyncedOrders.length === 0) {
                return { success: true, count: 0 };
            }

            console.log(`[Sync Upstream] A enviar ${unsyncedOrders.length} encomendas offline para o Supabase...`);
            let successCount = 0;

            for (const localOrder of unsyncedOrders) {
                // Prepare clean order payload for Supabase
                const orderPayload = {
                    restaurant_id: localOrder.restaurant_id,
                    items: localOrder.items,
                    total: localOrder.total,
                    customer_name: localOrder.customer_name,
                    customer_phone: localOrder.customer_phone,
                    table_number: localOrder.table_number,
                    order_type: localOrder.order_type,
                    status: localOrder.status,
                    created_at: new Date(localOrder.created_at).toISOString()
                };

                const { data, error } = await orderService.createOrder(orderPayload);
                if (error) {
                    console.error(`[Sync Upstream] Erro ao sincronizar encomenda local ${localOrder.id}:`, error);
                    // Discard if it's a structural or business validation failure (prevent infinite loop)
                    if (error.message && (error.message.includes('stock') || error.message.includes('Security'))) {
                        await localDbService.markOrderSynced(localOrder.id); // mark it to skip
                    }
                    continue;
                }

                // Mark as successfully synchronized in local Dexie
                await localDbService.markOrderSynced(localOrder.id);
                successCount++;
            }

            console.log(`[Sync Upstream] Sincronização upstream concluída. ${successCount} encomendas salvas no Supabase.`);
            return { success: true, count: successCount };

        } catch (e) {
            console.error('[Sync Upstream] Falha ao executar sincronização upstream:', e);
            return { success: false, error: e.message };
        }
    }
};

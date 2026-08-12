import Dexie from 'dexie';
import seedData from '../utils/seedData.json';

export const db = new Dexie('MenusJindungoLocalDB');

db.version(1).stores({
    restaurants: 'id, slug',
    categories: 'id, restaurant_id, sort_order',
    menu_items: 'id, category_id, restaurant_id, is_highlight',
    orders: 'id, restaurant_id, status, created_at, is_synced',
    sync_meta: 'key'
});

db.version(2).stores({
    restaurants: 'id, slug',
    categories: 'id, restaurant_id, sort_order',
    menu_items: 'id, category_id, restaurant_id, is_highlight',
    orders: 'id, restaurant_id, status, created_at, is_synced',
    sync_meta: 'key',
    stock_movements: 'id, item_id, type, created_at'
});

db.version(3).stores({
    restaurants: 'id, slug',
    categories: 'id, restaurant_id, sort_order',
    menu_items: 'id, category_id, restaurant_id, is_highlight',
    orders: 'id, restaurant_id, status, created_at, is_synced',
    sync_meta: 'key',
    stock_movements: 'id, item_id, type, created_at',
    cash_sessions: 'id, restaurant_id, opened_at, closed_at, status',
    cash_transactions: 'id, session_id, type, amount, created_at'
});

// Seed helper function to populate local database if empty (useful for 100% offline clients)
export const seedLocalDbIfEmpty = async () => {
    try {
        const count = await db.restaurants.count();
        if (count === 0 && seedData) {
            console.log("[LocalDB Seed] Database is empty. Seeding local database from bundled seed data...");
            
            // 1. Save Restaurant meta
            const restaurantMeta = {
                id: seedData.id,
                name: seedData.name,
                slug: seedData.slug,
                status: seedData.status,
                plan: seedData.plan,
                delivery_config: seedData.delivery_config,
                theme_config: seedData.theme_config,
                business_info: seedData.business_info,
                invoice_config: seedData.invoice_config
            };
            await db.restaurants.put(restaurantMeta);
            
            // 2. Save Categories and Menu Items
            const categories = seedData.categories || [];
            const categoriesToPut = [];
            const itemsToPut = [];
            
            categories.forEach(cat => {
                categoriesToPut.push({
                    id: cat.id,
                    restaurant_id: seedData.id,
                    label: cat.label,
                    sort_order: cat.sort_order || cat.position || 0
                });
                
                const items = cat.menu_items || [];
                items.forEach(item => {
                    itemsToPut.push({
                        id: item.id,
                        restaurant_id: seedData.id,
                        category_id: cat.id,
                        name: item.name,
                        price: parseFloat(item.price || 0),
                        img_url: item.img_url,
                        desc_text: item.desc_text,
                        available: item.available !== false,
                        track_stock: item.track_stock === true,
                        stock_quantity: item.stock_quantity || 0,
                        position: item.position || 0
                    });
                });
            });
            
            if (categoriesToPut.length > 0) {
                await db.categories.bulkPut(categoriesToPut);
            }
            if (itemsToPut.length > 0) {
                await db.menu_items.bulkPut(itemsToPut);
            }
            
            console.log(`[LocalDB Seed] Seeding complete! ${categoriesToPut.length} categories and ${itemsToPut.length} items populated.`);
        }
    } catch (e) {
        console.error("[LocalDB Seed] Failed to seed database:", e);
    }
};

// Automatically seed database on load
seedLocalDbIfEmpty();

const downloadAndCacheImage = async (url) => {
    if (!url || !url.startsWith('http')) return null;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to download image for caching:", url, e);
        return null;
    }
};

export const localDbService = {
    // Save or update restaurant details
    async saveRestaurant(restaurantData) {
        if (!restaurantData || !restaurantData.id) return;
        await db.restaurants.put(restaurantData);
    },

    // Get restaurant by slug
    async getRestaurantBySlug(slug) {
        return await db.restaurants.where('slug').equals(slug).first();
    },

    // Save categories in bulk
    async saveCategories(categoriesList) {
        if (!categoriesList || categoriesList.length === 0) return;
        await db.categories.bulkPut(categoriesList);
    },

    // Get categories for a restaurant
    async getCategories(restaurantId) {
        return await db.categories
            .where('restaurant_id')
            .equals(restaurantId)
            .sortBy('sort_order');
    },

    // Save menu items in bulk
    async saveMenuItems(itemsList) {
        if (!itemsList || itemsList.length === 0) return;
        // Save items immediately for layout responsiveness
        await db.menu_items.bulkPut(itemsList);
        
        // Background cache download task
        if (navigator.onLine) {
            (async () => {
                console.log(`[LocalDB Image Cache] Starting background download of images for ${itemsList.length} items...`);
                for (const item of itemsList) {
                    if (item.img_url) {
                        try {
                            const cached = await db.menu_items.get(item.id);
                            if (cached && cached.img_data) continue; // Already cached
                            
                            const base64 = await downloadAndCacheImage(item.img_url);
                            if (base64) {
                                await db.menu_items.update(item.id, { img_data: base64 });
                                console.log(`[LocalDB Image Cache] Cached image for item: ${item.name}`);
                            }
                        } catch (err) {
                            console.error(`[LocalDB Image Cache] Error caching item ${item.name}:`, err);
                        }
                    }
                }
                console.log("[LocalDB Image Cache] Background download finished.");
            })();
        }
    },

    // Get menu items for a category
    async getMenuItemsByCategory(categoryId) {
        return await db.menu_items.where('category_id').equals(categoryId).toArray();
    },

    // Save/Queue an order locally
    async saveOrder(orderData) {
        await db.orders.put(orderData);
    },

    // Get all unsynced orders
    async getUnsyncedOrders(restaurantId) {
        return await db.orders
            .where('is_synced')
            .equals(0)
            .and(item => item.restaurant_id === restaurantId)
            .toArray();
    },

    // Mark order as synced
    async markOrderSynced(orderId) {
        await db.orders.update(orderId, { is_synced: 1 });
    },

    // Get sync meta value
    async getSyncMeta(key) {
        const meta = await db.sync_meta.get(key);
        return meta ? meta.value : null;
    },

    // Set sync meta value
    async setSyncMeta(key, value) {
        await db.sync_meta.put({ key, value });
    },

    // Save a stock movement record
    async addStockMovement(movement) {
        const id = movement.id || `SM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const movementRecord = {
            id,
            created_at: new Date().toISOString(),
            ...movement
        };
        
        // 1. Save movement log
        await db.stock_movements.put(movementRecord);
        
        // 2. Adjust stock quantity on target menu_item
        const item = await db.menu_items.get(movement.item_id);
        if (item) {
            const currentQty = parseInt(item.stock_quantity) || 0;
            const newQty = currentQty + (parseInt(movement.quantity) || 0);
            
            await db.menu_items.update(movement.item_id, {
                stock_quantity: Math.max(0, newQty),
                ...(movement.cost_price ? { cost_price: parseFloat(movement.cost_price) } : {}),
                ...(movement.supplier_name ? { supplier_name: movement.supplier_name } : {})
            });
            console.log(`[LocalDB Stock] Adjusted stock for ${item.name}: ${currentQty} -> ${newQty}`);
        }
        return movementRecord;
    },

    // Get all movements for a specific item
    async getStockMovements(itemId) {
        return await db.stock_movements
            .where('item_id')
            .equals(itemId)
            .sortBy('created_at');
    },

    // Get all stock movements (reverse sorted by date)
    async getAllStockMovements() {
        const movements = await db.stock_movements.toArray();
        return movements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
};

import Dexie from 'dexie';
import seedData from '../utils/seedData.json';

export const db = new Dexie('MenusJindungoLocalDB');

// Define database schema
// Note: We only declare the indexable keys. Other properties are stored implicitly.
db.version(1).stores({
    restaurants: 'id, slug',
    categories: 'id, restaurant_id, sort_order',
    menu_items: 'id, category_id, restaurant_id, is_highlight',
    orders: 'id, restaurant_id, status, created_at, is_synced',
    sync_meta: 'key'
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
        await db.menu_items.bulkPut(itemsList);
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
    }
};

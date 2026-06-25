import Dexie from 'dexie';

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

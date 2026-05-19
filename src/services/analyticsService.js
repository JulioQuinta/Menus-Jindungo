import { supabase } from '../lib/supabaseClient';

export const analyticsService = {
    async trackView(restaurantId) {
        if (!restaurantId) return;

        // Simple session-based deduplication
        // In a real app we might use cookies or specialized analytics tools
        const sessionKey = `viewed_${restaurantId}`;
        const hasViewed = sessionStorage.getItem(sessionKey);

        if (hasViewed) return;

        try {
            await supabase.from('analytics_events').insert({
                restaurant_id: restaurantId,
                event_type: 'view_menu'
            });
            sessionStorage.setItem(sessionKey, 'true');
        } catch (err) {
            console.error('Analytics view tracking error:', err);
        }
    },

    async incrementOrders(restaurantId, cartItems) {
        if (!restaurantId) return;

        try {
            const itemCount = cartItems?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 1;
            const totalValue = cartItems?.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

            await supabase.from('analytics_events').insert({
                restaurant_id: restaurantId,
                event_type: 'order_completed',
                metadata: { items_count: itemCount, total_value: totalValue }
            });
        } catch (err) {
            console.error('Analytics order tracking error:', err);
        }
    },

    async trackAddToCart(restaurantId, item) {
        if (!restaurantId || !item) return;

        try {
            await supabase.from('analytics_events').insert({
                restaurant_id: restaurantId,
                event_type: 'add_to_cart',
                metadata: { item_id: item.id, item_name: item.name, price: item.price }
            });
        } catch (err) {
            console.error('Analytics add_to_cart tracking error:', err);
        }
    },

    async trackCheckoutStart(restaurantId, cartItems) {
        if (!restaurantId) return;

        try {
            const itemCount = cartItems?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 1;
            const totalValue = cartItems?.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

            await supabase.from('analytics_events').insert({
                restaurant_id: restaurantId,
                event_type: 'checkout_start',
                metadata: { items_count: itemCount, total_value: totalValue }
            });
        } catch (err) {
            console.error('Analytics checkout_start tracking error:', err);
        }
    },

    async getStats(restaurantId) {
        if (!restaurantId) return { viewsToday: 0, totalViews: 0 };

        try {
            // This relies on the RPC function we created.
            // If the user hasn't run the SQL yet, this might fail or return empty.
            // We should handle that gracefully.
            const { data: weeklyData, error } = await supabase.rpc('get_weekly_stats', { rest_id: restaurantId });

            if (error) {
                console.warn("Analytics RPC not found or error:", error);
                return { weeklyData: [], viewsToday: 0 };
            }

            // Calculate today views from the data
            const todayStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }); // MM/DD format
            const todayStats = weeklyData?.find(d => d.date === todayStr);

            return {
                weeklyData: weeklyData || [],
                viewsToday: todayStats ? todayStats.views : 0
            };

        } catch {
            return { weeklyData: [], viewsToday: 0 };
        }
    }
};

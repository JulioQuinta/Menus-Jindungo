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
            console.error('Analytics error:', err);
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

        } catch (err) {
            return { weeklyData: [], viewsToday: 0 };
        }
    }
};

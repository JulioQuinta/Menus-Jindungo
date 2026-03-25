import { supabase } from '../lib/supabaseClient';

export const loyaltyService = {
    /**
     * Fetch loyalty configuration for a restaurant
     */
    async getConfig(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('loyalty_configs')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .maybeSingle();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching loyalty config:', error);
            return { data: null, error };
        }
    },

    /**
     * Update or create loyalty configuration
     */
    async saveConfig(restaurantId, config) {
        try {
            const { data, error } = await supabase
                .from('loyalty_configs')
                .upsert({
                    restaurant_id: restaurantId,
                    ...config
                }, { onConflict: 'restaurant_id' })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error saving loyalty config:', error);
            return { data: null, error };
        }
    },

    /**
     * Get customer points (available stamps)
     */
    async getCustomerPoints(restaurantId, customerPhone) {
        if (!customerPhone) return { count: 0, error: null };

        try {
            // 1. Get Loyalty Config to know the goal
            const { data: config } = await this.getConfig(restaurantId);
            const goal = config?.goal || 10;

            // 2. Count total 'delivered' or 'paid' orders (Total stamps earned)
            const { count: totalOrders, error: err1 } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .eq('customer_phone', customerPhone)
                .in('status', ['paid', 'delivered'])
                .eq('is_loyalty_redemption', false);

            if (err1) throw err1;

            // 3. Count how many times they redeemed a reward
            const { count: totalRedemptions, error: err2 } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .eq('customer_phone', customerPhone)
                .in('status', ['paid', 'delivered'])
                .eq('is_loyalty_redemption', true);

            if (err2) throw err2;

            // 4. Points = Total Orders - (Redemptions * Goal)
            // Note: We only count orders that ARE NOT redemptions themselves as "stamps getters"
            const points = Math.max(0, (totalOrders || 0) - ((totalRedemptions || 0) * goal));

            return { count: points, error: null };
        } catch (error) {
            console.error('Error getting customer points:', error);
            return { count: 0, error };
        }
    }
};

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
     * Get customer points (completed orders count)
     */
    async getCustomerPoints(restaurantId, customerPhone) {
        if (!customerPhone) return { count: 0, error: null };

        try {
            // Only count 'delivered' or 'paid' orders as successful "stamps"
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('restaurant_id', restaurantId)
                .eq('customer_phone', customerPhone)
                .in('status', ['paid', 'delivered']);

            if (error) throw error;
            return { count: count || 0, error: null };
        } catch (error) {
            console.error('Error getting customer points:', error);
            return { count: 0, error };
        }
    }
};

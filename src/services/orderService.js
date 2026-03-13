import { supabase } from '../lib/supabaseClient';

export const orderService = {
    // Create a new order
    async createOrder(orderData) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating order:', error);
            return { data: null, error };
        }
    },

    // Update order status (Admin)
    async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating order:', error);
            return { data: null, error };
        }
    },

    // Get active orders for a restaurant (Admin)
    async getActiveOrders(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .neq('status', 'delivered') // Hide delivered/cancelled from main view
                .neq('status', 'cancelled')
                .order('created_at', { ascending: true }); // Oldest first

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching orders:', error);
            return { data: [], error };
        }
    },

    // Get daily sales (Admin) - Legacy, keep for compatibility
    async getDailySales(restaurantId) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('status', 'paid')
                .gte('created_at', today.toISOString());

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching daily sales:', error);
            return { data: [], error };
        }
    },

    // [NEW] Get sales by date range
    async getSalesByDateRange(restaurantId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, created_at, total, items, status')
                .eq('restaurant_id', restaurantId)
                .eq('status', 'paid')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching date range sales:', error);
            return { data: [], error };
        }
    },

    // Subscribe to realtime updates
    subscribeToOrders(restaurantId, onUpdate) {
        return supabase
            .channel('orders-channel')
            .on(
                'postgres_changes',
                {
                    event: '*', // Insert, Update, Delete
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`
                },
                (payload) => {
                    console.log('Realtime Order Update:', payload);
                    onUpdate(payload);
                }
            )
            .subscribe();
    }
};

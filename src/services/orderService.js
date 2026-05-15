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
    async updateOrderStatus(orderId, status, rejectionReason = null) {
        try {
            const updateData = { status };
            if (rejectionReason) updateData.rejection_reason = rejectionReason;

            const { data, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating order:', error);
            throw error; // Throw so the UI can catch it
        }
    },

    // Update general order data
    async updateOrder(orderId, updateData) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
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
                .neq('status', 'waiting_payment')
                .order('created_at', { ascending: true }); // Oldest first

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching orders:', error);
            return { data: [], error };
        }
    },

    // [NEW] Get a specific order by ID (For Motoboy Dashboard / Direct links)
    async getOrderById(orderId) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, restaurant:restaurants(name)')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching order by ID:', error);
            return { data: null, error };
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
    async getSalesByDateRange(restaurantId, startDate, endDate, status = 'paid') {
        try {
            let query = supabase
                .from('orders')
                .select('id, created_at, total, items, status')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (status === 'all') {
                query = query.neq('status', 'cancelled');
            } else if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching date range sales:', error);
            return { data: [], error };
        }
    },

    // [NEW] Get advanced analytics (Categories, Loyalty, etc.)
    async getAdvancedAnalytics(restaurantId, startDate, endDate) {
        try {
            const { data: orders, error } = await this.getSalesByDateRange(restaurantId, startDate, endDate, 'all');
            if (error) throw error;

            const analytics = {
                revenueByCategory: {},
                customerLoyalty: { new: 0, returning: 0 },
                uniqueCustomers: new Set(),
                returningPhones: new Set(),
                topCustomers: [],
                hourlyDistribution: Array(24).fill(0),
                totalRevenue: 0,
                totalOrders: orders.length
            };

            const customerStats = {};

            orders.forEach(order => {
                analytics.totalRevenue += (order.total || 0);
                
                // Hourly
                const hour = new Date(order.created_at).getHours();
                analytics.hourlyDistribution[hour] += (order.total || 0);

                // Category & Items
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const catId = item.category_id || 'uncategorized';
                        const catName = item.category_name || 'Sem Categoria';
                        if (!analytics.revenueByCategory[catName]) {
                            analytics.revenueByCategory[catName] = 0;
                        }
                        analytics.revenueByCategory[catName] += (item.price_value || parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0) * (item.quantity || 1);
                    });
                }

                // Loyalty
                if (order.customer_phone) {
                    if (!customerStats[order.customer_phone]) {
                        customerStats[order.customer_phone] = { count: 0, total: 0, name: order.customer_name };
                    }
                    customerStats[order.customer_phone].count += 1;
                    customerStats[order.customer_phone].total += (order.total || 0);
                    
                    if (customerStats[order.customer_phone].count > 1) {
                        analytics.returningPhones.add(order.customer_phone);
                    }
                    analytics.uniqueCustomers.add(order.customer_phone);
                }
            });

            analytics.customerLoyalty.returning = analytics.returningPhones.size;
            analytics.customerLoyalty.new = Math.max(0, analytics.uniqueCustomers.size - analytics.returningPhones.size);

            // Top Customers
            analytics.topCustomers = Object.entries(customerStats)
                .map(([phone, stats]) => ({ phone, ...stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            return { data: analytics, error: null };
        } catch (error) {
            console.error('Error in getAdvancedAnalytics:', error);
            return { data: null, error };
        }
    },

    // Subscribe to realtime updates
    subscribeToOrders(restaurantId, onUpdate) {
        return supabase
            .channel(`orders-channel-${restaurantId}`)
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

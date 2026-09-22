import { supabase } from '../lib/supabaseClient';
import { offlineDb, db } from '../lib/offlineDb';

export const orderService = {
    // Create a new order (Com Fallback Transparente Offline)
    async createOrder(orderData) {
        // Se explicitamente offline no browser, gravar logo localmente
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.log('[orderService] Dispositivo Offline. A gravar fatura/pedido no banco de dados local...');
            try {
                const savedOffline = await offlineDb.saveOfflineOrder(orderData);
                return { data: savedOffline, error: null, isOffline: true };
            } catch (offlineErr) {
                console.error('[orderService] Erro ao gravar pedido offline:', offlineErr);
                return { data: null, error: offlineErr };
            }
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.warn('[orderService] Falha na rede/cloud Supabase. A comutar para modo offline...', error);
            try {
                const savedOffline = await offlineDb.saveOfflineOrder(orderData);
                return { data: savedOffline, error: null, isOffline: true };
            } catch (fallbackErr) {
                console.error('[orderService] Falha crítica ao salvar offline:', fallbackErr);
                return { data: null, error };
            }
        }
    },

    // Update order status (Admin)
    async updateOrderStatus(orderId, status, rejectionReason = null, extraData = {}) {
        try {
            const updateData = { status, ...extraData };
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
            // Atualizar no DB local se falhar
            if (orderId) {
                await db.orders.update(orderId, { status, ...extraData });
            }
            throw error;
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

    // Get active orders for a restaurant (Admin) - Com Fallback Offline
    async getActiveOrders(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .neq('status', 'delivered')
                .neq('status', 'cancelled')
                .neq('status', 'waiting_payment')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.warn('[orderService] Falha na busca cloud. A carregar pedidos ativos do IndexedDB local...');
            try {
                const localOrders = await db.orders
                    .where('restaurant_id')
                    .equals(restaurantId)
                    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
                    .toArray();
                return { data: localOrders, error: null, isOffline: true };
            } catch (localErr) {
                console.error('Erro ao ler do IndexedDB local:', localErr);
                return { data: [], error };
            }
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
                .select('id, created_at, total, items, status, coupon_discount, customer_name, customer_phone')
                .eq('restaurant_id', restaurantId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (status === 'all') {
                query = query.neq('status', 'cancelled').neq('status', 'cancelado');
            } else if (status === 'raw_all' || status === null) {
                // Fetch everything, including cancelled orders
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

    // [NEW] Get advanced analytics (Categories, Loyalty, Top Products, Cancellation Rate, etc.)
    async getAdvancedAnalytics(restaurantId, startDate, endDate) {
        try {
            // Fetch raw_all to include cancelled orders for cancellation rate calculation
            const { data: allOrders, error } = await this.getSalesByDateRange(restaurantId, startDate, endDate, 'raw_all');
            if (error) throw error;

            const totalOrders = allOrders.length;
            const cancelledOrders = allOrders.filter(o => {
                const s = (o.status || '').toLowerCase().trim();
                return s === 'cancelled' || s === 'cancelado';
            });
            const cancelledCount = cancelledOrders.length;
            const cancellationRate = totalOrders > 0 ? Number(((cancelledCount / totalOrders) * 100).toFixed(1)) : 0;

            const activeOrders = allOrders.filter(o => {
                const s = (o.status || '').toLowerCase().trim();
                return s !== 'cancelled' && s !== 'cancelado';
            });

            const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const avgTicket = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

            const analytics = {
                revenueByCategory: {},
                customerLoyalty: { new: 0, returning: 0 },
                uniqueCustomers: new Set(),
                returningPhones: new Set(),
                topCustomers: [],
                topProducts: [],
                hourlyDistribution: Array(24).fill(0),
                hourlyVolume: Array(24).fill(0), // Count of orders per hour
                totalRevenue,
                totalOrders,
                activeOrdersCount: activeOrders.length,
                cancelledCount,
                cancellationRate,
                avgTicket
            };

            const customerStats = {};
            const productCounts = {};

            activeOrders.forEach(order => {
                // Hourly
                const hour = new Date(order.created_at).getHours();
                analytics.hourlyDistribution[hour] += (order.total || 0);
                analytics.hourlyVolume[hour] += 1;

                // Category & Items
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const catName = item.category_name || 'Sem Categoria';
                        const itemPrice = item.price_value || parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) || 0;
                        const itemQty = item.quantity ? parseInt(item.quantity, 10) : 1;
                        const itemName = item.name || 'Prato Sem Nome';

                        // Revenue by category
                        if (!analytics.revenueByCategory[catName]) {
                            analytics.revenueByCategory[catName] = 0;
                        }
                        analytics.revenueByCategory[catName] += itemPrice * itemQty;

                        // Quantity by item (for Top Products)
                        if (!productCounts[itemName]) {
                            productCounts[itemName] = 0;
                        }
                        productCounts[itemName] += itemQty;
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

            // Top Products (Top 5)
            analytics.topProducts = Object.entries(productCounts)
                .map(([name, quantity]) => ({ name, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
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

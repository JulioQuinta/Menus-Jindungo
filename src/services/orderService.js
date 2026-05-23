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
    async getAdvancedAnalytics(restaurantId, startDate, endDate, periodKey = 'hoje') {
        try {
            // Calculate previous period for comparison (same duration)
            const startMs = startDate.getTime();
            const endMs = endDate.getTime();
            const durationMs = endMs - startMs;
            const prevStartDate = new Date(startMs - durationMs);
            const prevEndDate = new Date(endMs - durationMs);

            // Fetch combined orders covering both current and previous period for performance (single DB call)
            const { data: allOrdersCombined, error } = await this.getSalesByDateRange(
                restaurantId, 
                prevStartDate, 
                endDate, 
                'raw_all'
            );
            if (error) throw error;

            // Separate orders into current and previous periods
            const allOrders = [];
            const previousOrders = [];

            (allOrdersCombined || []).forEach(order => {
                const orderTime = new Date(order.created_at).getTime();
                if (orderTime >= startMs && orderTime <= endMs) {
                    allOrders.push(order);
                } else if (orderTime >= prevStartDate.getTime() && orderTime <= prevEndDate.getTime()) {
                    previousOrders.push(order);
                }
            });

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

            // Previous period active orders for growth calculation
            const prevActiveOrders = previousOrders.filter(o => {
                const s = (o.status || '').toLowerCase().trim();
                return s !== 'cancelled' && s !== 'cancelado';
            });
            const prevRevenue = prevActiveOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            
            // Calculate real growth rate
            let growth = "+0%";
            if (prevRevenue > 0) {
                const diff = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
                growth = (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
            } else if (totalRevenue > 0) {
                growth = "+100%";
            }

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
                avgTicket,
                growth,
                chartData: getChartData(activeOrders, prevActiveOrders, periodKey, startDate, endDate)
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

                        // Quantity and Revenue by item (for Top Products - FIXED NaNs!)
                        if (!productCounts[itemName]) {
                            productCounts[itemName] = { quantity: 0, value: 0 };
                        }
                        productCounts[itemName].quantity += itemQty;
                        productCounts[itemName].value += itemPrice * itemQty;
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

            // Convert set of customers to array for cleanup
            analytics.uniqueCustomers = Array.from(analytics.uniqueCustomers);
            analytics.returningPhones = Array.from(analytics.returningPhones);

            // Top Customers
            analytics.topCustomers = Object.entries(customerStats)
                .map(([phone, stats]) => ({ phone, ...stats }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Top Products (Top 5 - FIXED NaNs!)
            analytics.topProducts = Object.entries(productCounts)
                .map(([name, stats]) => ({ name, quantity: stats.quantity, value: stats.value }))
                .sort((a, b) => b.value - a.value)
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

// Helper function to dynamically group orders into chart data points based on period Key
function getChartData(currentOrders, previousOrders, periodKey, startDate, endDate) {
    // Hourly brackets for 'hoje' or 'ontem'
    if (periodKey === 'hoje' || periodKey === 'ontem') {
        const brackets = [
            { label: '04:00', startH: 0, endH: 6 },
            { label: '09:00', startH: 6, endH: 11 },
            { label: '14:00', startH: 11, endH: 16 },
            { label: '19:00', startH: 16, endH: 21 },
            { label: '23:00', startH: 21, endH: 24 }
        ];
        return brackets.map(b => {
            const val = currentOrders
                .filter(o => {
                    const h = new Date(o.created_at).getHours();
                    return h >= b.startH && h < b.endH && o.status !== 'cancelled' && o.status !== 'cancelado';
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);
            const pass = previousOrders
                .filter(o => {
                    const h = new Date(o.created_at).getHours();
                    return h >= b.startH && h < b.endH && o.status !== 'cancelled' && o.status !== 'cancelado';
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);
            return { date: b.label, valor: val, passado: pass, proj: Math.round(val * 1.1) };
        });
    }

    // Daily brackets for 'semana' or 'semanaPassada'
    if (periodKey === 'semana' || periodKey === 'semanaPassada') {
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        const getAdjustedDay = (date) => {
            const d = new Date(date).getDay();
            return d === 0 ? 6 : d - 1; // Map Sunday to 6, Mon to 0
        };
        return days.map((day, idx) => {
            const val = currentOrders
                .filter(o => getAdjustedDay(o.created_at) === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            const pass = previousOrders
                .filter(o => getAdjustedDay(o.created_at) === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            return { date: day, valor: val, passado: pass, proj: Math.round(val * 1.1) };
        });
    }

    // Weekly brackets for 'mes' or 'mesPassado'
    if (periodKey === 'mes' || periodKey === 'mesPassado') {
        const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const getWeekIndex = (date, start) => {
            const d = new Date(date);
            const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return Math.min(3, Math.floor(diffDays / 7));
        };
        return weeks.map((week, idx) => {
            const val = currentOrders
                .filter(o => getWeekIndex(o.created_at, startDate) === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            
            const prevStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
            const pass = previousOrders
                .filter(o => getWeekIndex(o.created_at, prevStart) === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            return { date: week, valor: val, passado: pass, proj: Math.round(val * 1.1) };
        });
    }

    // Else group by month
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthsUsed = Array.from(new Set(currentOrders.map(o => new Date(o.created_at).getMonth())));
    if (currentMonthsUsed.length <= 1) {
        const quarters = ['T1', 'T2', 'T3', 'T4'];
        const getQuarterIdx = (date) => Math.floor(new Date(date).getMonth() / 3);
        return quarters.map((q, idx) => {
            const val = currentOrders
                .filter(o => getQuarterIdx(o.created_at) === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            const pass = previousOrders
                .filter(o => getQuarterIdx(o.created_at) === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            return { date: q, valor: val, passado: pass, proj: Math.round(val * 1.1) };
        });
    }

    return months.map((m, idx) => {
        const val = currentOrders
            .filter(o => new Date(o.created_at).getMonth() === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        const pass = previousOrders
            .filter(o => new Date(o.created_at).getMonth() === idx && o.status !== 'cancelled' && o.status !== 'cancelado')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        return { date: m, valor: val, passado: pass, proj: Math.round(val * 1.1) };
    }).filter(item => item.valor > 0 || item.passado > 0);
}

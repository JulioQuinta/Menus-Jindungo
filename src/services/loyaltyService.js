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
     },

    /**
     * Get real-time customer loyalty statistics for inactive & near-reward campaigns
     */
    async getCustomerLoyaltyStats(restaurantId) {
        try {
            // 1. Get Loyalty Config
            const { data: config } = await this.getConfig(restaurantId);
            const goal = config?.goal || 10;

            // 2. Fetch all completed/paid orders for this restaurant to calculate customer metrics
            const { data: orders, error } = await supabase
                .from('orders')
                .select('customer_name, customer_phone, created_at, status, is_loyalty_redemption')
                .eq('restaurant_id', restaurantId)
                .in('status', ['paid', 'delivered'])
                .not('customer_phone', 'is', null);

            if (error) throw error;

            if (!orders || orders.length === 0) {
                return {
                    inactiveCustomers: [],
                    nearRewardCustomers: [],
                    vipStats: { totalVips: 0, gold: 0, silver: 0, bronze: 0 }
                };
            }

            // 3. Group by customer phone
            const customerMap = {};
            orders.forEach(order => {
                const phone = order.customer_phone?.trim();
                if (!phone) return;

                if (!customerMap[phone]) {
                    customerMap[phone] = {
                        phone,
                        name: order.customer_name || 'Cliente Jindungo',
                        totalOrders: 0,
                        redemptions: 0,
                        lastPurchase: new Date(order.created_at)
                    };
                }

                // Update name if we have a better/newer one
                if (order.customer_name && (!customerMap[phone].name || customerMap[phone].name === 'Cliente Jindungo')) {
                    customerMap[phone].name = order.customer_name;
                }

                // Update last purchase date if this is newer
                const orderDate = new Date(order.created_at);
                if (orderDate > customerMap[phone].lastPurchase) {
                    customerMap[phone].lastPurchase = orderDate;
                }

                if (order.is_loyalty_redemption) {
                    customerMap[phone].redemptions += 1;
                } else {
                    customerMap[phone].totalOrders += 1;
                }
            });

            // 4. Calculate points, inactivity and construct list
            const now = new Date();
            const inactiveCustomers = [];
            const nearRewardCustomers = [];

            let goldCount = 0;
            let silverCount = 0;
            let bronzeCount = 0;

            Object.values(customerMap).forEach(cust => {
                const points = Math.max(0, cust.totalOrders - (cust.redemptions * goal));
                const daysInactive = Math.floor((now - cust.lastPurchase) / (1000 * 60 * 60 * 24));
                
                // Categorize for VIP tiers
                if (cust.totalOrders >= 15) {
                    goldCount++;
                    cust.tier = 'Ouro';
                } else if (cust.totalOrders >= 5) {
                    silverCount++;
                    cust.tier = 'Prata';
                } else {
                    bronzeCount++;
                    cust.tier = 'Bronze';
                }

                const enrichedCust = {
                    phone: cust.phone,
                    name: cust.name,
                    points,
                    lastPurchaseDate: cust.lastPurchase.toLocaleDateString('pt-AO'),
                    daysInactive,
                    totalOrders: cust.totalOrders,
                    tier: cust.tier
                };

                // Inactive (+15 days)
                if (daysInactive >= 15) {
                    inactiveCustomers.push(enrichedCust);
                }

                // Near reward (points are 1 or 2 away from goal, i.e., points === goal - 1 or points === goal - 2)
                if (points >= goal - 2 && points < goal) {
                    nearRewardCustomers.push(enrichedCust);
                }
            });

            // Sort inactive by longest inactivity first
            inactiveCustomers.sort((a, b) => b.daysInactive - a.daysInactive);

            // Sort near reward by highest points first
            nearRewardCustomers.sort((a, b) => b.points - a.points);

            return {
                inactiveCustomers,
                nearRewardCustomers,
                vipStats: {
                    totalVips: Object.keys(customerMap).length,
                    gold: goldCount,
                    silver: silverCount,
                    bronze: bronzeCount
                }
            };
        } catch (error) {
            console.error('Error compiling customer loyalty stats:', error);
            return {
                inactiveCustomers: [],
                nearRewardCustomers: [],
                vipStats: { totalVips: 0, gold: 0, silver: 0, bronze: 0 }
            };
        }
    }
};

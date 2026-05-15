import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntbzdlliymbworzqowb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGJ6ZGxsaXltYndvcnpxb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5NTEsImV4cCI6MjA4NDIzODk1MX0.Jy5VfnJzCxzWeSqiHZpnJW1ffox8AcYcpYFeh2Kj1mg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log("Checking orders in database...");
    
    // Get the first restaurant to use as reference
    const { data: restaurants } = await supabase.from('restaurants').select('id, name').limit(5);
    console.log("Restaurants found:", restaurants);

    if (restaurants && restaurants.length > 0) {
        // Find the one named "Comidas da Terra"
        const targetRest = restaurants.find(r => r.name.includes("Comidas da Terra")) || restaurants[0];
        const restId = targetRest.id;
        console.log(`Checking orders for restaurant: ${targetRest.name} (${restId})`);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restId);

        if (error) {
            console.error("Error fetching orders:", error);
        } else {
            console.log(`Total orders found: ${orders.length}`);
            orders.forEach(o => {
                console.log(`- Order ${o.id}: Status=${o.status}, Total=${o.total}, Date=${o.created_at}, Table=${o.table_number}`);
            });
            
            // Check today's range (using the current local time of the user)
            // The user's time is 2026-05-15T00:25:20+01:00.
            const today = new Date('2026-05-15T00:00:00+01:00');
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            console.log(`Today's filter range (ISO): ${today.toISOString()} to ${tomorrow.toISOString()}`);
            
            const todayOrders = orders.filter(o => {
                const date = new Date(o.created_at);
                return date >= today && date < tomorrow;
            });
            
            console.log(`Orders today: ${todayOrders.length}`);
            const revenueToday = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            console.log(`Revenue today: ${revenueToday} Kz`);
        }
    }
}

checkOrders();

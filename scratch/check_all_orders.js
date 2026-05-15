import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntbzdlliymbworzqowb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGJ6ZGxsaXltYndvcnpxb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5NTEsImV4cCI6MjA4NDIzODk1MX0.Jy5VfnJzCxzWeSqiHZpnJW1ffox8AcYcpYFeh2Kj1mg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllOrders() {
    console.log("Checking ALL orders in database...");
    
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, restaurant:restaurants(name)')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching orders:", error);
    } else {
        console.log(`Total orders found (limit 20): ${orders.length}`);
        orders.forEach(o => {
            console.log(`- Order ${o.id}: Status=${o.status}, Total=${o.total}, Date=${o.created_at}, Restaurant=${o.restaurant?.name || o.restaurant_id}`);
        });
        
        const now = new Date();
        console.log(`Current server time (approx): ${now.toISOString()}`);
    }
}

checkAllOrders();

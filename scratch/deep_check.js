import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntbzdlliymbworzqowb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGJ6ZGxsaXltYndvcnpxb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5NTEsImV4cCI6MjA4NDIzODk1MX0.Jy5VfnJzCxzWeSqiHZpnJW1ffox8AcYcpYFeh2Kj1mg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRestaurantsAndOrders() {
    console.log("Checking restaurants and recent activity...");
    
    const { data: restaurants } = await supabase.from('restaurants').select('id, name, slug');
    console.log("Restaurants found:", restaurants);

    const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, restaurant:restaurants(name)')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log("Most recent orders in SYSTEM:");
    recentOrders.forEach(o => {
        console.log(`- Order ${o.id}: Status=${o.status}, Total=${o.total}, Date=${o.created_at}, Restaurant=${o.restaurant?.name}`);
    });
}

checkRestaurantsAndOrders();

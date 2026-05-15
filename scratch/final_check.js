import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dntbzdlliymbworzqowb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGJ6ZGxsaXltYndvcnpxb3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjI5NTEsImV4cCI6MjA4NDIzODk1MX0.Jy5VfnJzCxzWeSqiHZpnJW1ffox8AcYcpYFeh2Kj1mg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComidasDaTerra() {
    const restId = 'def7479a-6c90-45e4-9d69-cae1aace983b';
    console.log(`Checking orders for Comidas da Terra (${restId})...`);
    
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${orders.length} orders.`);
        orders.forEach(o => {
            console.log(`- ${o.id}: Total=${o.total}, Date=${o.created_at}, Status=${o.status}`);
        });
    }
}

checkComidasDaTerra();

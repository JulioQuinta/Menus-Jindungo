import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersSchema() {
    console.log("Checking orders table schema if it exists...");

    // Test inserting a dummy order to see if RLS blocks it for public users
    const { data: d2, error: e2 } = await supabase.from('orders').insert([{
        restaurant_id: '123e4567-e89b-12d3-a456-426614174000',
        table_number: 'Mesa 1',
        customer_name: 'Test',
        items: [],
        total: 0,
        status: 'pending'
    }]);

    if (e2) {
        console.log("Error inserting order (might be RLS or missing table):", e2);
    } else {
        console.log("Insert successful (warning: dummy data created).");
        // Clean up
        await supabase.from('orders').delete().eq('restaurant_id', '123e4567-e89b-12d3-a456-426614174000');
    }
}

checkOrdersSchema();

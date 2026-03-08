import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("----- Checking specific data -----");
    const { data: rests } = await supabase.from('restaurants').select('id, name').order('created_at', { ascending: false }).limit(3);

    console.log("Recent Restaurants:");
    for (const r of rests) {
        const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id);
        const { count: itemCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', r.id);
        console.log(`- ${r.name} (ID: ${r.id}): ${catCount} categories, ${itemCount} items`);
    }
}
check();
